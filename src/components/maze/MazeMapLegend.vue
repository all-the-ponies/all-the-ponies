<script setup lang="ts">
import { mazeTileConfig } from '@/scripts/maze/tiles';


</script>

<template>
    <div class="legend-container">
        <h3 class="legend-heading">Legend</h3>
        <dl class="legend">
            <template v-for="tile in mazeTileConfig" :key="tile.id">
                <dt class="tile" :style="{backgroundColor: tile.color}"></dt>
                <dd>{{ $t(tile.name) }}</dd>
            </template>
        </dl>
    </div>
</template>

<style lang="css" scoped>

.legend {
    display: grid;
    grid-template-columns: 1rem auto;
    align-items: center;
    justify-content: center;
    gap: 0 0.5rem;
}

.legend-heading {
    font-size: 1.5rem;
    text-align: center;
}

.tile {
    border: 2px solid black;
    width: 1rem;
    height: 1rem;
    aspect-ratio: 1 / 1;
}

</style>
