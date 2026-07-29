import type { MazeBlockEntity, MazeMapBlock } from "@/types/gameDataTypes";
import { getMazeBoss, getMazeData, mazeGridOffset, mazeGridSize } from "../gameData";

export type MazeTileType = 'start' | 'miniboss' | 'boss' | 'chest' | 'helperShop' | 'coinShop' | 'skippable'

export interface MapTile {
    connections: MazeMapBlock['connections'],
    position: {
        original: {
            x: number,
            y: number,
        },
        normalized: {
            x: number,
            y: number,
        },
        visual?: {
            x: number,
            y: number,
        },
    },
    label: string,
    entity: MazeBlockEntity,
    coin_shop?: string,
    type?: MazeTileType,
}

export interface MazeTileConfig {
    id: MazeTileType,
    color: string,
    name: string,
    check?(tile: MapTile): boolean,
}

const mazeData = getMazeData()
const minibosses = [
    'Pony_Minotaurocellus_Red',
    'Pony_Minotaurocellus_Blue',
    'Pony_Minotaurocellus_Green',
    'Pony_Minotaurocellus_Yellow',
    'Pony_Minotaurocellus_Purple',
    'Pony_Minotaurocellus_Rose',
    'Pony_Minotaurocellus_Green_2',
]

export const mazeTileConfig: Record<MazeTileType, MazeTileConfig> = {
    start: {
        id: 'start',
        color: '#fdd666',
        name: 'maze.tile.start',
        check: (tile) => tile.entity?.id == 'MazeBlock_Start',
    },
    miniboss: {
        id: 'miniboss',
        color: '#e99898',
        name: 'maze.tile.miniboss',
        check: (tile) => {
            if (tile.entity?.type != 'MazeBoss') {
                return false
            }
            const mazeBoss = getMazeBoss(tile.entity.id)
            return minibosses.includes(mazeBoss.pony)
        }
    },
    boss: {
        id: 'boss',
        color: '#cc3e2d',
        name: 'maze.tile.boss',
        check: (tile) => {
            if (tile.entity?.type != 'MazeBoss') {
                return false
            }
            const mazeBoss = getMazeBoss(tile.entity.id)
            return !minibosses.includes(mazeBoss.pony)
        }
    },
    chest: {
        id: 'chest',
        color: '#b4d6a8',
        name: 'maze.tile.chest',
        check: (tile) => tile.entity?.type == 'MazeChest',
    },
    helperShop: {
        id: 'helperShop',
        color: '#a4c0f2',
        name: 'maze.tile.helper_shop',
        check: (tile) => tile.entity?.type == 'MazeShop',
    },
    coinShop: {
        id: 'coinShop',
        color: '#b4a5d4',
        name: 'maze.tile.coin_shop',
        check: (tile) => Boolean(tile.coin_shop),
    },
}

export function getTileType(tile: MapTile): MazeTileType | null {
    for (let tileConfig of Object.values(mazeTileConfig)) {
        if (tileConfig.check && tileConfig.check(tile)) {
            return tileConfig.id
        }
    }
}

export function createLabel(x: number, y: number) {
    return `${String.fromCharCode(64 + y)}${x}`
}

export function normalizePosition(x: number, y: number) {
    return {
        x: Math.round((x - mazeGridOffset.x) / mazeGridSize),
        y: Math.round((y - mazeGridOffset.y) / mazeGridSize),
    }
}

export function compareTiles(tileA: MapTile, tileB: MapTile) {
    if (!tileA || !tileB) {
        return false
    }
    
    return tileA.position.original.x == tileB.position.original.x &&
           tileA.position.original.x == tileB.position.original.x
}


// Pathfinding

export const connectionOffsets = {
    north_west: { x: 1, y: 0 },   // right
    north_east: { x: 0, y: 1 },   // down
    south_east: { x: -1, y: 0 },  // left
    south_west: { x: 0, y: -1 },  // up
}

export type ConnectionDirection = keyof typeof connectionOffsets

export function getNeighborCoords(tile: MapTile) {
    const { x, y } = tile.position.normalized
    return Object.entries(connectionOffsets)
        .filter(([dir]) => tile.connections[dir])
        .map(([, offset]) => ({ x: x + offset.x, y: y + offset.y }))
}

export function buildTileIndex(tiles: MapTile[]) {
    const byLabel = new Map<string, MapTile>()
    tiles.forEach(t => byLabel.set(t.label, t))
    return byLabel
}

function neighborsOf(tile: MapTile, byLabel: Map<string, MapTile>) {
    return getNeighborCoords(tile)
        .map(({ x, y }) => byLabel.get(createLabel(x, y)))
        .filter((t): t is MapTile => Boolean(t))
}

/** Shortest path from the nearest tile already in `allocated` to `targetLabel`.
 *  Returns the path EXCLUDING the allocated tile it starts from. Empty array
 *  if target is already allocated or unreachable. */
export function findPathToTile(
    targetLabel: string,
    allocated: Set<string>,
    byLabel: Map<string, MapTile>,
): MapTile[] {
    if (allocated.has(targetLabel)) return []

    const visited = new Set(allocated)
    const queue: MapTile[][] = [...allocated]
        .map(label => byLabel.get(label))
        .filter((t): t is MapTile => Boolean(t))
        .map(t => [t])

    while (queue.length) {
        const path = queue.shift()!
        const current = path[path.length - 1]

        for (const neighbor of neighborsOf(current, byLabel)) {
            if (visited.has(neighbor.label)) continue
            visited.add(neighbor.label)
            const nextPath = [...path, neighbor]
            if (neighbor.label === targetLabel) return nextPath.slice(1)
            queue.push(nextPath)
        }
    }
    return []
}

/** Given we're about to remove `label` from `allocated`, find every other
 *  allocated tile that would become unreachable from `startLabel` — i.e.
 *  everything "downstream" of the tile being deselected. */
export function findDependents(
    label: string,
    startLabel: string,
    allocated: Set<string>,
    byLabel: Map<string, MapTile>,
): string[] {
    const reachable = new Set([startLabel])
    const queue = [byLabel.get(startLabel)!]

    while (queue.length) {
        const current = queue.shift()!
        for (const neighbor of neighborsOf(current, byLabel)) {
            if (neighbor.label === label) continue // pretend it's removed
            if (!allocated.has(neighbor.label)) continue
            if (reachable.has(neighbor.label)) continue
            reachable.add(neighbor.label)
            queue.push(neighbor)
        }
    }

    return [...allocated].filter(l => l !== label && !reachable.has(l))
}
