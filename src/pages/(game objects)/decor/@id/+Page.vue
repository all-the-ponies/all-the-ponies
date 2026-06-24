<script setup lang="ts">
import { computed, onUnmounted, ref, watchEffect } from 'vue';
import gameData, { getFortuneShopData, getObject, translateName, useGameObject } from '@/scripts/gameData'
import CurrencyImage from '@/components/CurrencyImage.vue'
import BackButton from '@/components/buttons/BackButton.vue';
import { LOCATIONS } from '@/scripts/categories';
import { staticImage } from '@/scripts/common';
import { usePageContext } from 'vike-vue/usePageContext';
import { Config } from 'vike-vue/Config';
import absoluteUrl from '@/scripts/absoluteUrl';
import { useData } from 'vike-vue/useData';
import type { DecorType, FortuneShopItem } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';


const pageContext = usePageContext()
const data = useData<{decor: DecorType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const decor = computed(() => data.decor)

const basePrice = computed(() => {
    const result = {
        token: decor.value.price?.token,
        tokens: null,
        currency: decor.value.price?.base.currency,
        price: decor.value.price?.base.amount,
        dailyGoals: decor.value.price?.daily_goals,
    }
    if (priceHistory.value.length) {
        result.currency = priceHistory.value[0].price.base.currency
        result.price = priceHistory.value[0].price.base.price
        result.tokens = priceHistory.value[0].price.base.tokens
    }
    if (result.currency == 'Lotto') {
        result.currency = null // hide "Lotto" prices
    }
    return result
})

const name = computed(() => {
    let name = translateName(decor.value).value
    return name
})
const fortuneShopData = computed(() => getFortuneShopData(decor.value?.id))
// const fortuneShopData = ref<FortuneShopItem>()
// 
// watchEffect(() => {
//     getFortuneShopData(decor.value.id)
//         .then(info => fortuneShopData.value = info)
// })

const xpName = translateName(getObject('XP', 'item'))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(decor.image.main.path)"></Config>

    <div>
        <back-button fallback="/search/decor" />
        <div v-if="decor === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="decor">
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr>
                            <tr v-if="(basePrice.currency && basePrice.price) || (basePrice.token && basePrice.tokens)">
                                <td>{{ $t('common.price') }}</td>
                                <td>
                                    <template v-if="basePrice.token && basePrice.tokens">
                                        <CurrencyImage :object="basePrice.token">
                                            {{ $n(basePrice.tokens) }}
                                        </CurrencyImage>
                                        <template v-if="basePrice.currency && basePrice.price">
                                            {{}}
                                            {{ $t('common.or').toLocaleLowerCase() }} 
                                            {{}}
                                        </template>
                                    </template>
                                    <CurrencyImage v-if="basePrice.currency && basePrice.price" :object="basePrice.currency">
                                        {{ $n(basePrice.price) }}
                                    </CurrencyImage>
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('location.town') }}</td>
                                <td>{{ $t(LOCATIONS[decor.location].string) }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.common.size') }}</td>
                                <td>{{ decor.grid_size }}x{{ decor.grid_size }}</td>
                            </tr>
                            <tr>
                                <td>{{ xpName }}</td>
                                <td><currency-image object="XP">{{ $n(decor.xp) }}</currency-image></td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.decor.fusion_points') }}</td>
                                <td>{{decor.fusion_points ? $n(decor.fusion_points) : $t('game_object.decor.cannot_fuse') }}</td>
                            </tr>
                            <template v-if="decor.pro.is_pro">
                                <tr>
                                    <td colspan="2">{{ $t('game_object.decor.pro_decor') }}</td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.common.size') }}</td>
                                    <td>{{ decor.pro.size }}</td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.decor.effect') }}</td>
                                    <td v-if="decor.pro.bits">
                                        <currency-image object="Bits">
                                        +{{ decor.pro.bits }}%
                                        </currency-image>
                                    </td>
                                    <td v-else>
                                        -{{ decor.pro.time }}%
                                        <img src="@/assets/images/ui/timer.png" alt="Cooldown" class="object-image">
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">{{ $t('price_history.title') }}</h2>
                <PriceHistory :object="decor.id" :priceHistory="priceHistory"></PriceHistory>
            </section>
            <section class="section" v-if="fortuneShopData">
                <h2 class="h2">{{ $t('fortune_shop.title') }}</h2>
                <FortuneShopTable :prices="fortuneShopData.prices"></FortuneShopTable>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

</style>
