<script setup lang="ts">
import { getMazeData, mazeGridOffset, mazeGridSize } from '@/scripts/gameData';
import { getTileType, mazeTileConfig, type MapTile } from '@/scripts/maze/tiles';
import type { MazeBlockEntity, MazeMapBlock } from '@/types/gameDataTypes';

const emit = defineEmits<{
    clickTile: [tile: MapTile],
}>()

const entityTypeMap: Record<MazeBlockEntity['type'], string> =  {
    'MazeBlock_Start': 'maze-tile-start',
    'MazeBoss': 'maze-tile-boss',
    'MazeChest': 'maze-tile-chest',
    'MazeShop': 'maze-tile-shop',
}

const mazeData = getMazeData()

console.log('tileConfig', mazeTileConfig)

const map: MapTile[][] = []

function normalizePosition(x: number, y: number) {
    return {
        x: Math.round((x - mazeGridOffset.x) / mazeGridSize),
        y: Math.round((y - mazeGridOffset.y) / mazeGridSize),
    }
}

for (let block of mazeData.map.blocks) {
    const {x,y} = normalizePosition(block.x, block.y)

    if (!map[x]) {
        map[x] = []
    }

    map[x][y] = {
        connections: block.connections,
        x: x,
        y: y,
        entity: block.entity,
    }
}

for (let coin_shop of mazeData.map.shops) {
    const {x,y} = normalizePosition(coin_shop.x, coin_shop.y)
    map[x][y].coin_shop = coin_shop.id
}

console.log('map', map)
const mapSize = {
    width: map.length,
    height: map.reduce((x, y) => Math.max(x, y.length), 0)
}
const mapCenter = {
    x: (mapSize.width - 1) / 2,
    y: (mapSize.height - 1) / 2,
}

console.log('mapSize', mapSize, mapCenter)

function rotateNeg90(x: number, y: number) {
    return {
        x: Math.round(mapCenter.x + (y - mapCenter.x)),
        y: Math.round(mapCenter.y - (x - mapCenter.y)),
    }
}

map.flat().forEach(tile => tile.type = getTileType(tile))

const flattenedMap = map.flat().filter(tile => 
    tile.x !== 0 && tile.x + 1 !== mapSize.width &&
    tile.y !== 0 && tile.y + 1 !== mapSize.height
).map(tile => ({
    tile: tile,
    visualPos: rotateNeg90(tile.x, tile.y)
})).sort((a, b) => 
    a.visualPos.y - b.visualPos.y || a.visualPos.x - b.visualPos.x
)

function clickTile(tile: MapTile) {
    emit('clickTile', tile)
}

</script>

<template>
    <div class="maze-container">
        <button
            class="maze-tile"
            v-for="tile in flattenedMap"
            :class="{
                'tile-left': !tile.tile.connections.south_west,
                'tile-bottom': !tile.tile.connections.south_east,
                'tile-right': !tile.tile.connections.north_east,
                'tile-top': !tile.tile.connections.north_west,
            }"
            :style="{
                gridColumn: tile.visualPos.x,
                gridRow: tile.visualPos.y,
                '--tile-color': tile.tile.type ? mazeTileConfig[tile.tile.type].color : 'white',
            }"
            :key="`tile-${tile.visualPos.x},${tile.visualPos.y}`"
            @click="clickTile(tile.tile)"
        ></button>
    </div>
</template>

<style lang="css" scoped>

.maze-container {
    display: grid;
    max-width: 25rem;
    grid-template-columns: repeat(v-bind('mapSize.width - 2'), 1fr);
    /* transform: rotate(-90deg); */
    /* rotate: -120deg; */
}

.maze-tile {
    display: inline;
    --tile-color: white;
    background-color: var(--tile-color);
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    cursor: pointer;

    --border: 2px solid black;
    /* border: 1px solid rgba(211 211 211 / 0.2); */
    border: none;
    position: relative;

    --border-width: 2px;
    --border-color: black;
}

.maze-tile:hover,
.maze-tile:focus-visible {
    background-color: color-mix(in srgb, var(--tile-color), black 20%);
    outline: none;
}
.maze-tile:active {
    background-color: color-mix(in srgb, var(--tile-color), black 30%);
    outline: none;
}

.maze-tile::before {
    content: '';
    position: absolute;
    inset: -0.5px;
    pointer-events: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 1;
}

.maze-tile::after {
    content: '';
    position: absolute;
    inset: -1px;
    pointer-events: none;
    border: none;
    z-index: 2;
}

.tile-top::after {
    border-top: var(--border);
}
.tile-left::after {
    border-left: var(--border);
}
.tile-right::after {
    border-right: var(--border);
}
.tile-bottom::after {
    border-bottom: var(--border);
}

</style>
