<script setup lang="ts">
import { getMazeData, mazeGridOffset, mazeGridSize } from '@/scripts/gameData';
import { getTileType, mazeTileConfig, type MapTile, type MazeTileType } from '@/scripts/maze/tiles';

const emit = defineEmits<{
    clickTile: [tile: MapTile],
}>()
const selectedTile = defineModel<MapTile>('selectedTile')

const mazeData = getMazeData()

console.log('tileConfig', mazeTileConfig)

const selectableTiles: MazeTileType[] = ['chest', 'coinShop', 'helperShop', 'boss', 'miniboss']

const map: MapTile[][] = []

function normalizePosition(x: number, y: number) {
    return {
        x: Math.round((x - mazeGridOffset.x) / mazeGridSize),
        y: Math.round((y - mazeGridOffset.y) / mazeGridSize),
    }
}

function createLabel(x: number, y: number) {
    return `${String.fromCharCode(64 + y)}${x}`
}

for (let block of mazeData.map.blocks) {
    const {x,y} = normalizePosition(block.x, block.y)

    if (!map[x]) {
        map[x] = []
    }

    map[x][y] = {
        connections: block.connections,
        position: {
            original: {
                x: block.x,
                y: block.y,
            },
            normalized: {
                x: x,
                y: y,
            },
        },
        label: createLabel(x,y),
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
        x: Math.round(mapCenter.x + (y - mapCenter.y)),
        y: Math.round(mapCenter.y - (x - mapCenter.x)),
    }
}

map.flat().forEach(tile => tile.type = getTileType(tile))

const flattenedMap = map.flat().filter(tile => 
    tile.position.normalized.x !== 0 && tile.position.normalized.x + 1 !== mapSize.width &&
    tile.position.normalized.y !== 0 && tile.position.normalized.y + 1 !== mapSize.height
)
flattenedMap.forEach(tile => 
    tile.position.visual = rotateNeg90(tile.position.normalized.x, tile.position.normalized.y)
)
flattenedMap.sort((a, b) => 
    a.position.visual.y - b.position.visual.y || a.position.visual.x - b.position.visual.x
)

const visualMapSize = {
    width: mapSize.height - 2,
    height: mapSize.width - 2,
}

function clickTile(tile: MapTile) {
    selectedTile.value = tile
    emit('clickTile', tile)
}

function selectTile(label: string) {
    clickTile(flattenedMap.find(tile => tile.label == label))
}

defineExpose({
    selectTile,
})

</script>

<template>
    <div class="maze-container">
        <span
            class="grid-label"
            v-for="index in visualMapSize.width"
            :style="{
                gridColumn: index + 1,
                gridRow: 1,
            }"
        >{{ String.fromCharCode(64 + index) }}</span>
        <span
            class="grid-label"
            v-for="index in visualMapSize.height"
            :style="{
                gridColumn: 1,
                gridRow: index + 1,
            }"
        >{{ index }}</span>
        
        <button
            class="maze-tile"
            v-for="tile in flattenedMap"
            :class="{
                'tile-left': !tile.connections.south_west,
                'tile-bottom': !tile.connections.south_east,
                'tile-right': !tile.connections.north_east,
                'tile-top': !tile.connections.north_west,

                'selected-tile': selectedTile && tile.position.normalized.x == selectedTile.position.normalized.x && tile.position.normalized.y == selectedTile.position.normalized.y && selectableTiles.includes(tile.type),
            }"
            :style="{
                gridColumn: tile.position.visual.x + 1,
                gridRow: tile.position.visual.y + 1,
                '--tile-color': tile.type ? mazeTileConfig[tile.type].color : 'white',
            }"
            :key="`tile-${tile.label}`"
            @click="clickTile(tile)"
        ></button>
    </div>
</template>

<style lang="css" scoped>

.maze-container {
    display: grid;
    max-width: 25rem;
    width: 100%;
    grid-template-columns: repeat(v-bind('visualMapSize.width + 1'), 1fr);
    /* transform: rotate(-90deg); */
    /* rotate: -120deg; */
}

.grid-label {
    display: inline;
    text-align: center;
    --tile-color: white;
    color: black;
    background-color: var(--tile-color);
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    font-size: 95%;

    --border: 2px solid black;
    /* border: 1px solid rgba(211 211 211 / 0.2); */
    border: none;
    position: relative;
}

.grid-label::after {
    content: '';
    position: absolute;
    inset: -0.5px;
    pointer-events: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 1;
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
}

.maze-tile:hover,
.maze-tile:focus-visible {
    background-color: color-mix(in srgb, var(--tile-color), black 20%);
    outline: none;
}
.maze-tile:active,
.selected-tile {
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
