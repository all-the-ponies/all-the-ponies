<script setup lang="ts">
import ClientOnly from '@/components/ClientOnly.vue'
import CurrencyImage from '@/components/CurrencyImage.vue'
import { formatTime } from '@/scripts/common'
import gameData from '@/scripts/gameData'
import saveStats from '@/scripts/stats'
import { useSaveStore } from '@/stores/saveManager'
import { Config } from 'vike-vue/Config'
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'

const saveStore = useSaveStore()

const friendCodeInput = useTemplateRef('friend-code')
const importDisabled = ref<boolean>(false)
const friendCode = ref<string>()
const errorMessage = ref<string>('')

onMounted(() => {
    friendCode.value = saveStore.playerInfo.friendCode
})

async function importFriendCode() {
    errorMessage.value = ''
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
            <p>{{ errorMessage }}</p>
        </section>
        <section class="stats-section">
            <ClientOnly>
                <ul class="stats">
                    <li>
                        {{
                            $t('player_info.join_date', {
                                join_date: saveStore.playerInfo.joinDate ? $d(new Date(saveStore.playerInfo.joinDate), {
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
                            })
                        }}
                    </li>
                    <li>
                        {{ 
                            $t('stats.message.ponies.total', saveStats.ponies.total)
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.ponies', 1, {
                                named: {
                                    count: $n(saveStats.ponies.unique,)
                                },
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.transformable', 2, {
                                named: {
                                    count: $n(saveStats.ponies.changelings)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.stars', 2, {
                                named: {
                                    count: $n(saveStats.ponies.stars)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.houses', 2, {
                                named: {
                                    count: $n(saveStats.houses.total)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.shops', 2, {
                                named: {
                                    count: $n(saveStats.shops.bits + saveStats.shops.others)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.gem_shops', 2, {
                                named: {
                                    count: $n(saveStats.shops.gems)
                                }
                            })
                        }}
                    </li>
                    <li>
                        <CurrencyImage object="Gems">
                            {{gameData.translateName(gameData.getObject('Gems'))}}:
                            {{ $n(saveStore.playerInfo.currency.gems) }}
                        </CurrencyImage>
                    </li>
                    <li>
                        <CurrencyImage object="Bits">
                            {{gameData.translateName(gameData.getObject('Bits'))}}:
                            {{ $n(saveStore.playerInfo.currency.bits) }}
                        </CurrencyImage>
                    </li>
                </ul>
            </ClientOnly>
        </section>
    </div>
</template>

<style lang="css" scoped>
.stats li {
    list-style: none;
}
</style>
