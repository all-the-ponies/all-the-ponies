import type { MazeBlockEntity, MazeMapBlock } from "@/types/gameDataTypes";
import { getMazeBoss, getMazeData } from "../gameData";

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
    skippable: {
        id: 'skippable',
        color: '#aaaaaa',
        name: 'maze.tile.skippable',
    },
}

export function getTileType(tile: MapTile): MazeTileType | null {
    for (let tileConfig of Object.values(mazeTileConfig)) {
        if (tileConfig.check && tileConfig.check(tile)) {
            return tileConfig.id
        }
    }
}
