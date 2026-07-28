<script setup lang="ts">
import HelperShop from '@/components/maze/HelperShop.vue';
import MazeBossView from '@/components/maze/MazeBossView.vue';
import MazeChestPreview from '@/components/maze/MazeChestPreview.vue';
import MazeCoinShop from '@/components/maze/MazeCoinShop.vue';
import MazeInfoContainer from '@/components/maze/MazeInfoContainer.vue';
import MazeMap from '@/components/maze/MazeMap.vue';
import MazeMapLegend from '@/components/maze/MazeMapLegend.vue';
import { isDev, notNullIsh } from '@/scripts/common';
import { getMazeChest, getMazeData } from '@/scripts/gameData';
import type { MapTile } from '@/scripts/maze/tiles';
import { Config } from 'vike-vue/Config';
import { useData } from 'vike-vue/useData';
import { usePageContext } from 'vike-vue/usePageContext';
import { modifyUrl } from 'vike/modifyUrl';
import { computed, nextTick, onMounted, provide, ref, useTemplateRef, watch } from 'vue';
import type { Data } from './+data';
import { useSaveStore } from '@/stores/saveManager';
import MazePonyCard from '@/components/maze/MazePonyCard.vue';

const mazeData = getMazeData()
const saveStore = useSaveStore()
const pageContext = usePageContext()
const data = useData<Data>()

const mazeActive = computed(() => data.mazeActive || isDev())

const mapElement = useTemplateRef('map-element')
const friendCodeInput = useTemplateRef('friend-code-input')

const editMode = ref<boolean>(false)
const selectedTile = ref<MapTile>()
const errorMessage = ref<string>('')
const friendCode = ref<string>('')
const importDisabled = ref<boolean>(false)

provide('mazeActive', mazeActive)

async function importFriendCode() {
    errorMessage.value = ''
    if (!friendCode.value) {
        return
    }
    importDisabled.value = true
    try {
        const loadingSave = saveStore.loadFromCloud(friendCode.value)

        const mazeActive = await saveStore.loadMazeProgressFromCloud(friendCode.value)

        await loadingSave

        if (!mazeActive) {
            errorMessage.value = 'Maze not active'
        }
    } catch (error) {
        console.error(error)
        errorMessage.value = error
        nextTick(() => {
            friendCodeInput.value.focus()
        })
    }

    importDisabled.value = false
}

function close() {
    selectedTile.value = null
}


function toggleEdit() {
    editMode.value = !editMode.value
}


watch(
    selectedTile,
    () => {
        console.log('New tile', selectedTile.value)
    if (!selectedTile.value) {
        history.replaceState(
            null,
            '',
            modifyUrl(
                pageContext.urlOriginal,
                {
                    search: {
                        tile: null
                    }
                }
            )
        )
    } else {
        history.replaceState(
            null,
            '',
            modifyUrl(
                pageContext.urlOriginal,
                {
                    search: {
                        tile: `${selectedTile.value.label}`
                    }
                }
            )
        )
    }
})

onMounted(() => {
    if (pageContext.urlParsed.search.tile) {
        mapElement.value.selectTile(pageContext.urlParsed.search.tile)
    }
    friendCode.value = saveStore.playerInfo.friendCode
})

</script>

<template>
    <Config :title="$t('maze.title.long')"></Config>

    <div>
        <section>
            <h1>{{ $t('maze.title.long') }}</h1>
        </section>
        <section class="section">
            <div>
                <label>
                    {{ $t('maze.message.import_progress') }}
                    <input
                        ref="friend-code-input"
                        class="text-box"
                        :placeholder="$t('player_info.friend_code')"
                        type="text"
                        v-model="friendCode"
                        :disabled="importDisabled"
                        @submit="importFriendCode()"
                        @input="errorMessage = ''"
                    >
                </label>
                <button
                    class="button button-blue"
                    :disabled="importDisabled"
                    @click="importFriendCode()"
                >{{ $t('common.import') }}</button>
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            </div>
            <div>
                <button class="button button-blue" @click="toggleEdit()">
                    {{ editMode ? 'Done' : 'Edit' }}
                </button>
            </div>
        </section>
        <section class="section map-section">
            <MazeMap
                ref="map-element"
                v-model:selected-tile="selectedTile"
                :editable="editMode"
            ></MazeMap>
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
        <section class="section helpers-section">
            <h2>{{ $t('maze.message.helpers.title') }}</h2>
            <p class="no-helpers" v-if="Object.keys(saveStore.mazeProgress.helpers).length === 0">
                {{ $t('maze.message.helpers.no_helpers') }}
            </p>
            <div class="maze-helpers" v-else>
                <MazePonyCard
                    v-for="mazePony in Object.keys(saveStore.mazeProgress.helpers)"
                    :maze-pony="mazePony"
                    show-save
                    :editable="editMode"
                ></MazePonyCard>
            </div>
        </section>
    </div>
</template>

<style lang="css" scoped>

.error-message {
    color: var(--red);
}

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

.helpers-section {
    min-height: 10rem;
}

.no-helpers {
    text-align: center;
}

.maze-helpers {
    display: grid;
    --card-size: 8rem;
    grid-template-columns: repeat(auto-fit, 8.5rem);
    align-items: center;
    justify-items: center;
    justify-content: center;
}

</style>
