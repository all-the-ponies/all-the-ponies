<script setup lang="ts">
import CurrencyImage from '@/components/CurrencyImage.vue'
import PlayerCard from '@/components/PlayerCard/PlayerCard.vue'
import type { PlayerStatName } from '@/scripts/api.types'
import { getObject, translateName, useGameObject, useObjectName } from '@/scripts/gameData'
import { useSaveStats } from '@/scripts/stats'
import { formatTime } from '@/scripts/timeFunctions'
import { useSaveStore } from '@/stores/saveManager'
import { computedAsync } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { Config } from 'vike-vue/Config'
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'

const saveStore = useSaveStore()
const saveStats = useSaveStats()

const friendCodeInput = useTemplateRef('friend-code')
const importDisabled = ref<boolean>(false)
const friendCode = ref<string>()
const errorMessage = ref<string>('')

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
        case 'pony': return saveStats.value.ponies.unique
        case 'pony_alt': return saveStats.value.ponies.changelings
        case 'shop': return saveStats.value.shops.bits + saveStats.value.shops.others
        case 'gem_shop': return saveStats.value.shops.gems
        case 'costume': return saveStore.costumes.size
        default: return 0
    }
}

const leftStat = computed(() => ({
    type: saveStore.playerInfo.player_card.display_stats.left,
    value: getStat(saveStore.playerInfo.player_card.display_stats.left),
}))

const rightStat = computed(() => ({
    type: saveStore.playerInfo.player_card.display_stats.right,
    value: getStat(saveStore.playerInfo.player_card.display_stats.right),
}))

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
            <section class="stats-section">
                <ul class="stats">
                    <div class="player-card-container">
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
                        >
                        </PlayerCard>
                    </div>
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
                                total_playtime: formatTime(saveStore?.playerInfo.totalPlaytime),
                            })
                        }}
                    </li>
                    
                    <!-- Keep disabled -->
                    <!-- <li>
                        {{ 
                            $t('stats.message.ponies.total', saveStats?.ponies.total)
                        }}
                    </li> -->
                   
                    <li>
                        {{
                            $t('inventory.stats.ponies', 2, {
                                named: {
                                    count: $n(saveStats?.ponies.unique)
                                },
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.transformable', 2, {
                                named: {
                                    count: $n(saveStats?.ponies.changelings)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.stars', 2, {
                                named: {
                                    count: $n(saveStats?.ponies.stars)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.houses', 2, {
                                named: {
                                    count: $n(saveStats?.houses.total)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.shops', 2, {
                                named: {
                                    count: $n(saveStats?.shops.bits + saveStats?.shops.others)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.gem_shops', 2, {
                                named: {
                                    count: $n(saveStats?.shops.gems)
                                }
                            })
                        }}
                    </li>
                    <li>
                        <CurrencyImage object="Gems">
                            {{ gemsName }}:
                            {{ $n(saveStore?.playerInfo.currency.gems) }}
                        </CurrencyImage>
                    </li>
                    <li>
                        <CurrencyImage object="Bits">
                            {{ bitsName }}:
                            {{ $n(saveStore?.playerInfo.currency.bits) }}
                        </CurrencyImage>
                    </li>
                </ul>
            </section>
        </ClientOnly>
    </div>
</template>

<style lang="css" scoped>

.player-card {
    max-width: 30rem;
}

.stats li {
    list-style: none;
}

.error-message {
    color: var(--red);
}
</style>
