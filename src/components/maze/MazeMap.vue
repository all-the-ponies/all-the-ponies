<script setup lang="ts">
import { getMazeData } from '@/scripts/gameData';
import { buildTileIndex, compareTiles, createLabel, findDependents, findPathToTile, getTileType, mazeTileConfig, normalizePosition, type MapTile, type MazeTileType } from '@/scripts/maze/tiles';
import { useSaveStore } from '@/stores/saveManager';
import { useMounted } from '@vueuse/core';
import { computed, getCurrentInstance, inject, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

const props = defineProps<{
    editable?: boolean,
}>()

const isEditable = computed(() => props.editable)
const mazeActive = inject('mazeActive', ref(false))



const emit = defineEmits<{
    clickTile: [tile: MapTile],
}>()
const selectedTile = defineModel<MapTile>('selectedTile')
const lastClickedTile = ref<MapTile>()

const mazeData = getMazeData()
const saveStore = useSaveStore()
const isMounted = useMounted()

const map: MapTile[][] = []

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

const mapSize = {
    width: map.length,
    height: map.reduce((x, y) => Math.max(x, y.length), 0)
}
const mapCenter = {
    x: (mapSize.width - 1) / 2,
    y: (mapSize.height - 1) / 2,
}

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

const visualMap: MapTile[][] = []

flattenedMap.forEach(tile => {
    const {x,y} = tile.position.visual
    if (!visualMap[y]) {
        visualMap[y] = []
    }
    visualMap[y][x] = tile
})

const visualMapSize = {
    width: mapSize.height - 2,
    height: mapSize.width - 2,
}

const tileByLabel = buildTileIndex(flattenedMap)
const startTile = flattenedMap.find(tile => tile.type === 'start')
const uncoveredLabels = computed(() => {
    const uncovered = new Set<string>()

    if (!saveStore.hasMazeBlock(startTile.position.original.x, startTile.position.original.y)) {
        saveStore.addMazeBlock(startTile.position.original.x, startTile.position.original.y)
    }

    for (let block of saveStore.mazeProgress.map.blocks) {
        const {x,y} = normalizePosition(block.x, block.y)
        const tile = map[x][y]
        if (tileByLabel.has(tile.label)) {
            uncovered.add(tile.label)
        }
    }

    return uncovered
})
const hoveredLabel = ref<string | null>(null)

const hoverPreview = computed(() => {
    if (!hoveredLabel.value || !isEditable.value) {
        return { toUncover: new Set<string>(), toCover: new Set<string>() }
    }

    if (uncoveredLabels.value.has(hoveredLabel.value)) {
        if (hoveredLabel.value === startTile?.label) {
            return { toUncover: new Set<string>(), toCover: new Set<string>() }
        }
        const dependents = findDependents(
            hoveredLabel.value, startTile!.label, uncoveredLabels.value, tileByLabel,
        )
        return { toUncover: new Set<string>(), toCover: new Set([hoveredLabel.value, ...dependents]) }
    }

    const path = findPathToTile(hoveredLabel.value, uncoveredLabels.value, tileByLabel)
    return { toUncover: new Set(path.map(t => t.label)), toCover: new Set<string>() }
})


// Accessibility: keyboard grid navigation + focus management
//
// A "roving tabindex" is used: only one tile is a tab stop at a time
// (tabindex="0"), every other tile is tabindex="-1". Arrow keys move that
// single tab stop around the grid using each tile's *visual* x/y position
// (i.e. what's actually on screen, after the -90deg rotation), and move
// real DOM focus along with it. This matches the standard "grid" keyboard
// pattern screen reader / keyboard users expect, and keeps Tab from having
// to step through every tile individually.

const tileRefs = new Map<string, HTMLButtonElement>()
function setTileRef(label: string, el: Element | { $el: Element } | null) {
    if (!el) {
        tileRefs.delete(label)
        return
    }
    tileRefs.set(label, ('$el' in el ? el.$el : el) as HTMLButtonElement)
}

const visualIndex = new Map<string, MapTile>()
flattenedMap.forEach(tile => {
    if (tile.position.visual) {
        visualIndex.set(`${tile.position.visual.x},${tile.position.visual.y}`, tile)
    }
})

const focusedLabel = ref<string>(startTile?.label ?? flattenedMap[0]?.label ?? '')

// Keep the roving tabindex pointed at the current selection so that when a
// keyboard user tabs into the map, they land where they last were.
watch(selectedTile, (tile) => {
    if (tile) {
        focusedLabel.value = tile.label
    }
})

function focusTile(label: string) {
    focusedLabel.value = label
    nextTick(() => tileRefs.get(label)?.focus())
}

const arrowKeyOffsets: Record<string, { x: number, y: number }> = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
}

function handleTileKeydown(event: KeyboardEvent, tile: MapTile) {
    if (event.key === 'Home' && startTile) {
        event.preventDefault()
        focusTile(startTile.label)
        return
    }

    const offset = arrowKeyOffsets[event.key]
    if (!offset || !tile.position.visual) {
        return
    }
    event.preventDefault()

    const target = visualIndex.get(`${tile.position.visual.x + offset.x},${tile.position.visual.y + offset.y}`)
    if (target) {
        focusTile(target.label)
    }
}

function isTileCovered(tile: MapTile): boolean {
    return Boolean(
        mazeActive.value && tile.type != 'start' && isMounted.value &&
        !saveStore.hasMazeBlock(tile.position.original.x, tile.position.original.y)
    )
}

function tileAriaLabel(tile: MapTile): string {
    const parts = [tile.label]

    if (tile.type) {
        parts.push(t(mazeTileConfig[tile.type].name))
    }

    if (isTileCovered(tile)) {
        parts.push(t('maze.tile.locked'))
    }

    if (!isEditable.value && selectedTile.value?.label === tile.label) {
        parts.push(t('maze.tile.selected'))
    }

    return parts.join(', ')
}

function clickTile(tile: MapTile) {
    lastClickedTile.value = tile
    if (isEditable.value) {
        if (uncoveredLabels.value.has(tile.label)) {
            if (tile.label === startTile?.label) return // start can't be deselected

            const dependents = findDependents(
                tile.label, startTile!.label, uncoveredLabels.value, tileByLabel,
            )
            saveStore.removeMazeBlock(tile.position.original.x, tile.position.original.y)
            dependents.forEach(label => {
                const tile = tileByLabel.get(label)
                if (!tile) {
                    console.log('missing tile', label)
                    return
                }
                saveStore.removeMazeBlock(tile.position.original.x, tile.position.original.y)
            })
        } else {
            const path = findPathToTile(tile.label, uncoveredLabels.value, tileByLabel)
            path.forEach(tile => saveStore.addMazeBlock(tile.position.original.x, tile.position.original.y))
        }
    } else {
        if (selectedTile.value?.label == tile?.label) {
            selectedTile.value = null
        } else {
            selectedTile.value = tile
        }
        emit('clickTile', tile)
    }
}

function selectTile(label: string) {
    const tile = flattenedMap.find(tile => tile.label == label)
    selectedTile.value = tile
    if (tile) {
        emit('clickTile', tile)
    }
}

defineExpose({
    selectTile,
    focusTile,
})

// onMounted(() => {
//     if (!saveStore.hasMazeBlock(startTile.position.original.x, startTile.position.original.y)) {
//         saveStore.addMazeBlock(startTile.position.original.x, startTile.position.original.y)
//     }
// })

</script>

<template>
    <div class="maze-container" role="group" aria-label="Maze map" aria-roledescription="grid">
        <div class="maze-row" role="row">
            <span
                class="grid-label"
                role="columnheader"
                aria-hidden="true"
                v-for="index in visualMapSize.width"
                :style="{
                    gridColumn: index + 1,
                    gridRow: 1,
                }"
            >{{ String.fromCharCode(64 + index) }}</span>
        </div>

        <div
            v-for="(row, rowIndex) in visualMap.slice(1)"
            class="maze-row"
            role="row"
        >
            <span
                class="grid-label"
                aria-hidden="true"
                role="rowheader"
                :style="{
                    gridColumn: 1,
                    gridRow: rowIndex + 2,
                }"
            >{{ rowIndex + 1 }}</span>

            <template v-for="tile in row">
                <button
                    class="maze-tile"
                    v-if="tile"
                    :key="`tile-${tile.label}`"
                    role="gridcell"
                    :class="{
                        'tile-left': !tile.connections.south_west,
                        'tile-bottom': !tile.connections.south_east,
                        'tile-right': !tile.connections.north_east,
                        'tile-top': !tile.connections.north_west,
    
                        'selected-tile': !isEditable && selectedTile && tile.position.normalized.x == selectedTile.position.normalized.x && tile.position.normalized.y == selectedTile.position.normalized.y,
                        'preview-select-tile': hoverPreview.toUncover.has(tile.label) && (!compareTiles(tile, lastClickedTile)),
                        'preview-deselect-tile': hoverPreview.toCover.has(tile.label) && (!compareTiles(tile, lastClickedTile)),
    
                        'tile-covered': mazeActive && tile.type != 'start' && isMounted && !saveStore.hasMazeBlock(tile.position.original.x, tile.position.original.y),
                    }"
                    :style="{
                        gridColumn: tile.position.visual.x + 1,
                        gridRow: tile.position.visual.y + 1,
                        '--tile-color': tile.type ? mazeTileConfig[tile.type].color : 'white',
                    }"
                    :ref="(el) => setTileRef(tile.label, el as HTMLButtonElement | null)"
                    :tabindex="tile.label === focusedLabel ? 0 : -1"
                    :aria-label="tileAriaLabel(tile)"
                    :aria-pressed="!isEditable && selectedTile?.label === tile.label ? 'true' : undefined"
                    @click="clickTile(tile)"
                    @focus="focusedLabel = tile.label"
                    @keydown="handleTileKeydown($event, tile)"
                    @mouseenter="hoveredLabel = tile.label"
                    @mouseleave="hoveredLabel = null, lastClickedTile = null"
                ></button>
            </template>
        </div>
        
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

.maze-row {
    display: contents;
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
    --additional-fade: 0%;
    --fade: 0%;
    /* background-color: color-mix(in srgb, var(--tile-color), black calc(var(--fade) + var(--additional-fade))); */
    background-color: oklab(from var(--tile-color) calc(l * (100% - (var(--fade) + var(--additional-fade)))) a b);
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    cursor: pointer;

    --border: 2px solid black;
    /* border: 1px solid rgba(211 211 211 / 0.2); */
    border: none;
    position: relative;
}

.tile-covered {
    --additional-fade: 30%;
}

.maze-tile:hover:not(.preview-select-tile):not(.preview-deselect-tile),
.maze-tile:focus-visible {
    --fade: 15%;
    outline: none;
}
.maze-tile:active,
.selected-tile {
    --fade: 30%;
    outline: none;
}

.preview-select-tile {
    --additional-fade: 0%;
    --fade: 5%;
}

.preview-deselect-tile {
    --additional-fade: 0%;
    --fade: 15%;
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

.maze-tile:focus-visible::after {
    border: 2px solid rgb(136, 255, 0);
    z-index: 3;
}

.selected-tile::after {
    border: 2px solid yellow;
    z-index: 3;
}

</style>
