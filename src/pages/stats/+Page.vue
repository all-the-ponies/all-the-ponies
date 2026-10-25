<script setup lang="ts">
import CurrencyImage from '@/components/CurrencyImage.vue'
import PlayerCard from '@/components/PlayerCard/PlayerCard.vue'
import type { PlayerStatName } from '@/types/gameDataTypes'
import { createAssetUrl } from '@/scripts/assets'
import { getObject, translateName, useGameObject, useObjectName } from '@/scripts/gameData'
import { useSaveStats, totalStats } from '@/scripts/stats'
import { formatTime } from '@/scripts/timeFunctions'
import { useSaveStore } from '@/stores/saveManager'
import { computedAsync, useMounted } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { Config } from 'vike-vue/Config'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import StatCard from '@/components/stats/StatCard.vue'
import { watchEffect } from 'vue'

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

watchEffect(() => {
    console.log('stats', saveStats.value)
})

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

console.log('total stats', totalStats)

</script>

<template>
    <Config :title="$t('stats.title')" :description="$t('stats.description')"></Config>

    <div
        class="stats-page"
        :style="{
            backgroundImage: `url('${backgroundImage}')`,
        }"
    >
        <ClientOnly>
            <section class="section player-section">
                <div class="header-section stats-section">
                    <div>
                        <h1>{{ $t('stats.title') }}</h1>
                    </div>
                    <div class="import-section">
                        <label>
                            <p>{{ $t('player_info.friend_code') }}</p>
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
                                size="10"
                            >
                            <button
                                class="button button-blue"
                                :disabled="importDisabled"
                                @click="importFriendCode()"
                            >{{ $t('common.import') }}</button>
                        </label>
                        <p class="error-message">{{ errorMessage }}</p>
                    </div>
                </div>
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
                    <span>
                        <CurrencyImage object="Gems" position="left">
                            {{ $n(saveStore.playerInfo.currency.gems) }}
                        </CurrencyImage>
                    </span>
                    <span>
                        <CurrencyImage object="Bits" position="left">
                            {{ $n(saveStore.playerInfo.currency.bits) }}
                        </CurrencyImage>
                    </span>
                </div>
                <div class="stats-section">
                    <div class="stats-grid">
                        <StatCard
                            stat="pony"
                            :value="saveStats?.ponies.unique"
                            :total="totalStats.ponies.unique"
                        ></StatCard>
                        <StatCard
                            stat="pony_alt"
                            :value="saveStats?.ponies.changelings"
                            :total="totalStats.ponies.changelings"
                        ></StatCard>
                        <StatCard
                            stat="pro_ponies"
                            :value="saveStats?.ponies.pros"
                            :total="totalStats.ponies.pros"
                        ></StatCard>
                        <StatCard
                            stat="gem_ponies"
                            :value="saveStats?.ponies.gemCollectors"
                            :total="totalStats.ponies.gemCollectors"
                        ></StatCard>
                        <StatCard
                            stat="bit_ponies"
                            :value="saveStats?.ponies.bitCollectors"
                            :total="totalStats.ponies.bitCollectors"
                        ></StatCard>
                        <StatCard
                            stat="stars"
                            :value="saveStats?.ponies.stars"
                            :total="totalStats.ponies.stars"
                        ></StatCard>
                        <StatCard
                            stat="shop"
                            :value="saveStats?.shops.mainTotal"
                            :total="totalStats.shops.mainTotal"
                        ></StatCard>
                        <StatCard
                            stat="bit_shops"
                            :value="saveStats?.shops.bits"
                            :total="totalStats.shops.bits"
                        ></StatCard>
                        <StatCard
                            stat="gem_shop"
                            :value="saveStats?.shops.gems"
                            :total="totalStats.shops.gems"
                        ></StatCard>
                        <StatCard
                            stat="critters"
                            :value="saveStats?.shops.critters"
                            :total="totalStats.shops.critters"
                        ></StatCard>
                        <StatCard
                            stat="costume"
                            :value="saveStats?.costumes.total"
                            :total="totalStats.costumes.total"
                        ></StatCard>
                        <StatCard
                            stat="collection"
                            :value="saveStats?.collections.total"
                            :total="totalStats.collections.total"
                        ></StatCard>
                        <StatCard
                            stat="hots"
                            :value="saveStore?.playerInfo.stats.whCollections"
                            :total="155"
                        ></StatCard>
                    </div>
                </div>
                <div class="stats-section">
                    <ul class="stats-list">
                        <li>
                            {{
                                $t('player_info.join_date', {
                                    join_date: saveStore?.playerInfo.joinDate ? $d(new Date(saveStore?.playerInfo.joinDate), {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    }) : ''
                                })
                            }}
                        </li>
                        <li>
                            {{
                                $t('player_info.total_playtime', {
                                    total_playtime: formatTime(saveStore.playerInfo.totalPlaytime),
                                    hours: formatTime(saveStore.playerInfo.totalPlaytime, {units: ['hours']}),
                                })
                            }}
                        </li>
                    </ul>
                </div>
            </section>
        </ClientOnly>
    </div>
</template>

<style lang="css" scoped>

.stats-page {
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

    --max-width: 35rem;
}

.player-section {
    padding: 1rem;
    
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.player-card {
    max-width: var(--max-width);
    margin: 1rem auto;
    display: block;
}

.stats-section {
    max-width: var(--max-width);
    padding: 0.5rem;
    /* min-height: 30rem; */
    margin: 1rem auto;
    display: block;

    background: rgba(255, 255, 255, 0.3);
    border-radius: 15px;
}

.header-section {
    display: flex;
    justify-content: space-around;
    align-items: center;
}

.import-section {
    text-align: center;
}

.stats-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, 10rem);
    justify-content: space-evenly;
    gap: 0.5rem;
}

.stats-list li {
    list-style: none;
}

.error-message {
    color: var(--red);
}
</style>
