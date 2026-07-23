<script setup lang="ts">
import MazeMap from '@/components/maze/MazeMap.vue';
import MazeMapLegend from '@/components/maze/MazeMapLegend.vue';
import { getMazeData } from '@/scripts/gameData';
import type { MapTile } from '@/scripts/maze/tiles';
import { Config } from 'vike-vue/Config';
import { ref } from 'vue';

const mazeData = getMazeData()

const selectedTile = ref<MapTile>()

function selectTile(tile: MapTile) {
    selectedTile.value = tile
}

</script>

<template>
    <Config :title="$t('maze.title.long')"></Config>

    <div>
        <section>
            <h1>{{ $t('maze.title.long') }}</h1>
        </section>
        <section class="section">
            <label>
                {{ $t('maze.message.import_progress') }}
                <input class="text-box" :placeholder="$t('player_info.friend_code')" type="text">
            </label>
            <button class="button button-blue">{{ $t('common.import') }}</button>
        </section>
        <section class="section map-section">
            <MazeMap @click-tile="selectTile"></MazeMap>
            <MazeMapLegend></MazeMapLegend>
        </section>
        <section>

        </section>
    </div>
</template>

<style lang="css" scoped>

.map-section {
    display: flex;
    gap: 0.5rem;
    justify-content: space-around;
    flex-wrap: wrap;
}

</style>
