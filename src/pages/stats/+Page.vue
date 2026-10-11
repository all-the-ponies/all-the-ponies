<script setup lang="ts">
import CurrencyImage from '@/components/CurrencyImage.vue'
import PlayerCard from '@/components/PlayerCard/PlayerCard.vue'
import type { PlayerStatName } from '@/types/gameDataTypes'
import { createAssetUrl } from '@/scripts/assets'
import { getObject, translateName, useGameObject, useObjectName } from '@/scripts/gameData'
import { useSaveStats } from '@/scripts/stats'
import { formatTime } from '@/scripts/timeFunctions'
import { useSaveStore } from '@/stores/saveManager'
import { computedAsync, useMounted } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { Config } from 'vike-vue/Config'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import StatCard from '@/components/stats/StatCard.vue'

const saveStore = useSaveStore()
const saveStats = useSaveStats()

const friendCodeInput = useTemplateRef('friend-code')
const importDisabled = ref<boolean>(false)
const friendCode = ref<string>()
const errorMessage = ref<string>('')
const isMounted = useMounted()

onMounted(() => {
    friendCode.value = saveStore.playerInfo.friendCode
})

async function importFriendCode() {
    errorMessage.value = ''
    if (!friendCode.value) {
        return
    }
    importDisabled.value = true
    try {
        await saveStore.loadFromCloud(friendCode.value)
    } catch (error) {
        console.error(error)
        errorMessage.value = error
        nextTick(() => {
            friendCodeInput.value.focus()
        })
    }

    importDisabled.value = false
}

const gemsName = translateName(getObject('Gems', 'item'))
const bitsName = translateName(getObject('Bits', 'item'))

function getStat(stat: PlayerStatName) {
    switch (stat) {
        case 'pony': return saveStats.value?.ponies.unique
        case 'pony_alt': return saveStats.value?.ponies.changelings
        case 'shop': return saveStats.value?.shops.bits + saveStats.value.shops.others
        case 'gem_shop': return saveStats.value?.shops.gems
        case 'costume': return saveStats.value.costumes.total
        case 'collection': return saveStats.value.collections.total
        case 'hots': return saveStore?.playerInfo.stats.whCollections
        default: return 0
    }
}

const leftStat = computed(() => {
    if (isMounted.value) {
        return {
            type: saveStore.playerInfo.player_card.display_stats.left,
            value: getStat(saveStore.playerInfo.player_card.display_stats.left),
        }
    }
})

const rightStat = computed(() => {
    if (isMounted.value) {
        return {
            type: saveStore.playerInfo.player_card.display_stats.right,
            value: getStat(saveStore.playerInfo.player_card.display_stats.right),
        }
    }
})

const backgroundImage = computed(() => {
    if (isMounted.value && saveStore.playerInfo.player_card.background) {
        console.log('background:', saveStore.playerInfo.player_card.background)
        console.log('url', createAssetUrl(getObject(saveStore.playerInfo.player_card.background, 'background').image.main.path))
        return createAssetUrl(getObject(saveStore.playerInfo.player_card.background, 'background').image.main.path)
    }
})

</script>

<template>
    <Config :title="$t('stats.title')" :description="$t('stats.description')"></Config>

    <div>
        <section class="import-section">
            <h1>{{ $t('stats.title') }}</h1>
            <label>
                {{ $t('player_info.friend_code') }}
                <input
                    v-model="friendCode"
                    ref="friend-code"
                    type="text"
                    name="friend-code"
                    class="text-box"
                    :placeholder="$t('player_info.friend_code')"
                    spellcheck="false"
                    :disabled="importDisabled"
                    @keydown="(e) => {if (e.key === 'Enter') importFriendCode()}"
                    @input="errorMessage = ''"
                >
                <button
                    class="button button-blue"
                    :disabled="importDisabled"
                    @click="importFriendCode()"
                >{{ $t('common.import') }}</button>
            </label>
            <p class="error-message">{{ errorMessage }}</p>
        </section>
        <ClientOnly>
            <section class="section player-section" :style="{
                backgroundImage: `url('${backgroundImage}')`,
            }">
                <PlayerCard
                    class="player-card"
                    v-if="saveStore.playerInfo.friendCode"
                    :friend-code="saveStore.playerInfo.friendCode"
                    :left-name="saveStore.playerInfo.player_card.name.left"
                    :right-name="saveStore.playerInfo.player_card.name.right"
                    :level="saveStore.playerInfo.level"
                    :xp="saveStore.playerInfo.xp"
                    :required-xp="saveStore.playerInfo.required_xp"
                    :background="saveStore.playerInfo.player_card.background"
                    :background-frame="saveStore.playerInfo.player_card.background_frame"
                    :avatar="saveStore.playerInfo.player_card.avatar"
                    :avatar-frame="saveStore.playerInfo.player_card.avatar_frame"
                    :cutie-mark="saveStore.playerInfo.player_card.cutie_mark"
                    :left-stat="leftStat"
                    :right-stat="rightStat"
                ></PlayerCard>
                <div class="stats-section">
                    <div class="stats-grid">
                        <StatCard
                            stat="pony"
                            :value="10"
                            :total="20"
                        ></StatCard>
                        <StatCard
                            stat="pony_alt"
                            :value="10"
                            :total="20"
                        ></StatCard>
                        <StatCard
                            stat="shop"
                            :value="10"
                            :total="20"
                        ></StatCard>
                        <StatCard
                            stat="gem_shop"
                            :value="10"
                            :total="20"
                        ></StatCard>
                        <StatCard
                            stat="collection"
                            :value="10"
                            :total="20"
                        ></StatCard>
                        <StatCard
                            stat="hots"
                            :value="10"
                            :total="20"
                        ></StatCard>
                    </div>
                </div>
            </section>
        </ClientOnly>
    </div>
</template>

<style lang="css" scoped>

.player-section {
    padding: 1rem;
    
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.player-card {
    max-width: 30rem;
    margin: 1rem auto;
    display: block;
}

.stats-section {
    max-width: 30rem;
    /* min-height: 30rem; */
    margin: 1rem auto;
    display: block;

    background: rgba(255, 255, 255, 0.3);
}

.stats-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, 10rem);
    justify-content: space-evenly;
    gap: 0.5rem;
    padding: 0.5rem;
}

.stats li {
    list-style: none;
}

.error-message {
    color: var(--red);
}
</style>
