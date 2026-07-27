<script setup lang="ts">
import HelperShop from '@/components/maze/HelperShop.vue';
import MazeBossView from '@/components/maze/MazeBossView.vue';
import MazeChestPreview from '@/components/maze/MazeChestPreview.vue';
import MazeCoinShop from '@/components/maze/MazeCoinShop.vue';
import MazeInfoContainer from '@/components/maze/MazeInfoContainer.vue';
import MazeMap from '@/components/maze/MazeMap.vue';
import MazeMapLegend from '@/components/maze/MazeMapLegend.vue';
import { getMazeChest, getMazeData } from '@/scripts/gameData';
import type { MapTile } from '@/scripts/maze/tiles';
import { Config } from 'vike-vue/Config';
import { ref } from 'vue';

const mazeData = getMazeData()

const selectedTile = ref<MapTile>()

function selectTile(tile: MapTile) {
    selectedTile.value = tile
}

function close() {
    selectedTile.value = null
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
            <div class="info-container" v-if="selectedTile?.type == 'helperShop'">
                <HelperShop :shop-id="selectedTile.entity.id" @close="close()"></HelperShop>
            </div>
            <div class="info-container" v-else-if="selectedTile?.type == 'chest'">
                <MazeChestPreview :chest-id="selectedTile.entity.id" @close="close()"></MazeChestPreview>
            </div>
            <div class="info-container" v-else-if="selectedTile?.type == 'coinShop'">
                <MazeCoinShop :shop-id="selectedTile.coin_shop" @close="close()"></MazeCoinShop>
            </div>
            <div class="info-container" v-else-if="selectedTile?.type == 'boss' || selectedTile?.type == 'miniboss'">
                <MazeBossView :boss-id="selectedTile.entity.id" @close="close()"></MazeBossView>
            </div>
            <MazeMapLegend v-else class="map-legend"></MazeMapLegend>
        </section>
        <section class="section">
        </section>
    </div>
</template>

<style lang="css" scoped>

.map-section {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    align-items: flex-start;
}

.map-legend {
    justify-self: center;
    flex-grow: 1;
}

.info-container {
    justify-self: center;
    flex-grow: 1;
    /* flex-shrink: 0; */
    min-width: 0;
    flex-basis: 19rem;
}

</style>
