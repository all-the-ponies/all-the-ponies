<script setup lang="ts">
import HelperShop from '@/components/maze/HelperShop.vue';
import MazeBossView from '@/components/maze/MazeBossView.vue';
import MazeChestPreview from '@/components/maze/MazeChestPreview.vue';
import MazeCoinShop from '@/components/maze/MazeCoinShop.vue';
import MazeMap from '@/components/maze/MazeMap.vue';
import MazeMapLegend from '@/components/maze/MazeMapLegend.vue';
import { isDev } from '@/scripts/common';
import { getMazeData, translateName } from '@/scripts/gameData';
import type { MapTile, MazeTileType } from '@/scripts/maze/tiles';
import { Config } from 'vike-vue/Config';
import { useData } from 'vike-vue/useData';
import { usePageContext } from 'vike-vue/usePageContext';
import { modifyUrl } from 'vike/modifyUrl';
import { computed, getCurrentInstance, nextTick, onMounted, provide, ref, useTemplateRef, watch } from 'vue';
import type { Data } from './+data.server';
import { useSaveStore } from '@/stores/saveManager';
import MazePonyCard from '@/components/maze/MazePonyCard.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { useMounted, useTimestamp } from '@vueuse/core';
import { ClientOnly } from 'vike-vue/ClientOnly';
import DialogComponent from '@/components/DialogComponent.vue';
import { useI18n } from 'vue-i18n';
import InfoCard from '@/components/InfoCard.vue';
import Notice from '@/components/notice/Notice.vue';

const mazeData = getMazeData()
const saveStore = useSaveStore()
const pageContext = usePageContext()
const data = useData<Data>()
const { t } = useI18n()

const selectableTiles: MazeTileType[] = ['chest', 'coinShop', 'helperShop', 'boss', 'miniboss']

const mazeActive = computed(() => data.mazeActive || isDev())

const mapElement = useTemplateRef('map-element')
const friendCodeInput = useTemplateRef('friend-code-input')
const confirmResetDialog = useTemplateRef('confirm-reset-dialog')

const mazeTitle = translateName(mazeData)
const editMode = ref<boolean>(false)
const selectedTile = ref<MapTile>()
const errorMessage = ref<string>('')
const friendCode = ref<string>('')
const importDisabled = ref<boolean>(false)
const infoPanel = useTemplateRef('info-panel')

const suppressNextAutoFocus = ref(false)

// NOTE: `maze.message.legend.title` is a guess at a key for "legend" -
// swap in whatever key you actually use for the legend heading, if any.
const infoPanelLabel = computed(() => {
    switch (selectedTile.value?.type) {
        case 'helperShop': return t('maze.tile.helper_shop')
        case 'chest': return t('maze.tile.chest')
        case 'coinShop': return t('maze.tile.coin_shop')
        case 'boss': return t('maze.tile.boss')
        case 'miniboss': return t('maze.tile.miniboss')
        default: return t('maze.message.legend')
    }
})

provide('mazeActive', mazeActive)

const energyMax = 300
const energyCooldown = 114
const currentTime = useTimestamp()
const isMounted = useMounted()

const energy = computed(() => {
    // This runs every millisecond
    if (!isMounted.value || !mazeActive.value || !saveStore.mazeProgress.last_energy_time) {
        return 0
    }
    const timeDiff = (currentTime.value / 1000) - saveStore.mazeProgress.last_energy_time
    return Math.min(saveStore.mazeProgress.energy + Math.floor((timeDiff) / energyCooldown), energyMax)
})

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
            errorMessage.value = t('maze.message.not_active')
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
    const previousLabel = selectedTile.value?.label
    selectedTile.value = null
    if (previousLabel) {
        mapElement.value?.focusTile(previousLabel)
    }
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
        // Move focus to the side panel so screen reader users notice the
        // new content (a helper shop, chest, boss, etc.) as soon as it
        // appears, instead of it silently changing next to a focused map tile.
        if (!suppressNextAutoFocus.value) {
            nextTick(() => infoPanel.value?.focus())
        } else {
            suppressNextAutoFocus.value = false
        }
    }
})

async function resetProgress() {
    const willReset = await confirmResetDialog.value.open()

    if (willReset) {
        saveStore.resetMazeProgress()
    }
}

onMounted(() => {
    if (pageContext.urlParsed.search.tile) {
        suppressNextAutoFocus.value = true
        mapElement.value.selectTile(pageContext.urlParsed.search.tile)
    }
    friendCode.value = saveStore.playerInfo.friendCode
})

</script>

<template>
    <Config :title="mazeTitle"></Config>

    <div>
        <section>
            <h1>{{ mazeTitle }}</h1>
            <InfoCard type="note">
                {{ $t('maze.message.update_note.outdated') }}
            </InfoCard>

            <!-- <InfoCard type="note">
                {{ $t('maze.message.update_note.updated') }}
            </InfoCard> -->
        </section>
        <section class="section" v-if="mazeActive">
            <div class="import-bar">
                <label>
                    {{ $t('maze.message.import_progress') }}
                    <input
                        ref="friend-code-input"
                        class="text-box"
                        :placeholder="$t('player_info.friend_code')"
                        type="text"
                        v-model="friendCode"
                        :disabled="importDisabled"
                        @keydown="(e) => {if (e.key === 'Enter')importFriendCode()}"
                        @input="errorMessage = ''"
                    >
                </label>
                <button
                    class="button button-blue"
                    :disabled="importDisabled"
                    @click="importFriendCode()"
                >{{ $t('common.import') }}</button>
                <button class="button button-red" @click="resetProgress()">Reset</button>
                <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            </div>
            <div class="resources-bar">
                <button class="button button-blue" @click="toggleEdit()">
                    {{ editMode ? $t('button.done') : $t('button.edit') }}
                </button>
                <span class="resource">
                    {{ energy }}
                    <img src="@/assets/images/ui/maze/maze-energy-icon.png" :alt="$t('maze.message.maze_energy')" class="resource-image">
                </span>
                <span class="resource">
                    <CurrencyImage object="Consumable_Maze_Tier0">
                        {{ isMounted ? saveStore.mazeProgress.currency : 0 }}
                    </CurrencyImage>
                </span>
                <span class="resource">
                    <CurrencyImage object="Token_Maze_Upgrade_Token">
                        {{ isMounted ? saveStore.mazeProgress.upgrade_tokens : 0 }}
                    </CurrencyImage>
                </span>
            </div>
        </section>
        <section class="section map-section">
            <MazeMap
                ref="map-element"
                v-model:selected-tile="selectedTile"
                :editable="editMode"
            ></MazeMap>
            <div
                :class="selectableTiles.includes(selectedTile?.type) ? 'info-container' : 'map-legend'"
                ref="info-panel"
                tabindex="-1"
                role="region"
                :aria-label="infoPanelLabel"
            >
                <HelperShop v-if="selectedTile?.type == 'helperShop'" :shop-id="selectedTile.entity.id" @close="close()"></HelperShop>
                <MazeChestPreview v-else-if="selectedTile?.type == 'chest'" :chest-id="selectedTile.entity.id" @close="close()"></MazeChestPreview>
                <MazeCoinShop v-else-if="selectedTile?.type == 'coinShop'" :shop-id="selectedTile.coin_shop" @close="close()"></MazeCoinShop>
                <MazeBossView v-else-if="selectedTile?.type == 'boss' || selectedTile?.type == 'miniboss'" :boss-id="selectedTile.entity.id" @close="close()"></MazeBossView>
                <MazeMapLegend v-else></MazeMapLegend>
            </div>
        </section>
        <ClientOnly>
            <section class="section helpers-section" v-if="mazeActive">
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
        </ClientOnly>
    </div>

    
    <DialogComponent
        ref="confirm-reset-dialog"
        :title="$t('maze.dialog.reset.title')"
    >
        {{
            $t('maze.dialog.reset.body')
        }}
        <template #menu>
            <button @click="confirmResetDialog.submit()" class="button button-red">{{ $t('button.yes') }}</button>
            <button @click="confirmResetDialog.cancel()" class="button button-green">{{ $t('button.no') }}</button>
        </template>
    </DialogComponent>
</template>

<style lang="css" scoped>

.import-bar {
    margin-block: 1rem;

}

.error-message {
    color: var(--red);
}


.resources-bar {
    display: flex;
    align-items: center;
    margin: 1rem 2rem;
}

.resource {
    margin-inline: 0.5rem;
}

.resource-image {
    height: 1em;
    object-fit: contain;
    object-position: center;
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
