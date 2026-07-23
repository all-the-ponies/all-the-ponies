<script setup lang="ts">
import MazeMap from '@/components/maze/MazeMap.vue';
import MazeMapLegend from '@/components/maze/MazeMapLegend.vue';
import { Config } from 'vike-vue/Config';


</script>

<template>
    <Config :title="$t('maze.title.long')"></Config>

    <div>
        <section>
            <h1>{{ $t('maze.title.long') }}</h1>
        </section>
        <section class="section">
            <label>
                Import progress:
                <input class="text-box" placeholder="Friend code" type="text">
            </label>
            <button class="button button-blue">Import</button>
        </section>
        <section class="section map-zection">
            <MazeMap @click-tile="(tile) => console.log('tile', tile)"></MazeMap>
            <MazeMapLegend></MazeMapLegend>
        </section>
    </div>
</template>

<style lang="css" scoped>

.map-zection {
    display: flex;
    gap: 0.5rem;
    justify-content: space-around;
    flex-wrap: wrap;
}

</style>
