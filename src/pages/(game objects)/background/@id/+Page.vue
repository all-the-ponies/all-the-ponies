<script setup lang="ts">
import { computed } from 'vue';
import gameData, { getFortuneShopData, getObject, translateName } from '@/scripts/gameData'
import BackButton from '@/components/buttons/BackButton.vue';
import { staticImage } from '@/scripts/common';
import { usePageContext } from 'vike-vue/usePageContext';
import { Config } from 'vike-vue/Config';
import absoluteUrl from '@/scripts/absoluteUrl';
import Link from '@/components/Link.vue';
import { useData } from 'vike-vue/useData';
import type { BackgroundType } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';


const pageContext = usePageContext()
const data = useData<{background: BackgroundType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const background = computed(() => data.background)

const basePrice = computed(() => {
    const result = {
        token: background.value.price?.token,
        tokens: null,
        currency: background.value.price?.base.currency,
        price: background.value.price?.base.amount,
        dailyGoals: background.value.price?.daily_goals,
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
    let name = translateName(background.value).value
    return name
})

const fortuneShopData = computedAsync(async () => await getFortuneShopData(background.value?.id))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(background.image.preview.path)"></Config>

    <div>
        <back-button fallback="/search/backgrounds" />
        <div v-if="background === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="background">
                <template #image-right>
                    <InventoryAddButton :gameObject="background.id"></InventoryAddButton>
                </template>
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
                                <td>{{ $t('game_object.profile_decorations.is_default') }}</td>
                                <td>{{ background.is_default }}</td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">{{ $t('price_history.title') }}</h2>
                <PriceHistory :object="background.id" :priceHistory="priceHistory"></PriceHistory>
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
