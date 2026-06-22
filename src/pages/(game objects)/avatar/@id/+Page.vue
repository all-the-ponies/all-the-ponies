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
import type { AvatarType, DecorType } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';


const pageContext = usePageContext()
const data = useData<{avatar: AvatarType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const avatar = computed(() => data.avatar)

const basePrice = computed(() => {
    const result = {
        token: avatar.value.price?.token,
        tokens: null,
        currency: avatar.value.price?.base.currency,
        price: avatar.value.price?.base.amount,
        dailyGoals: avatar.value.price?.daily_goals,
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
    let name = translateName(avatar.value).value
    return name
})

const pony = computedAsync(async () => await getObject(avatar.value?.pony, 'pony'))

const fortuneShopData = computedAsync(async () => await getFortuneShopData(avatar.value?.id))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(avatar.image.preview.path)"></Config>

    <div>
        <back-button fallback="/search/avatars" />
        <div v-if="avatar === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="avatar">
                <template #image-right>
                    <InventoryAddButton :gameObject="avatar.id"></InventoryAddButton>
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
                                <td>{{ avatar.is_default }}</td>
                            </tr>
                            <tr v-if="avatar.animated">
                                <td>{{ $t('game_object.profile_decorations.avatar.animated') }}</td>
                                <td>{{ avatar.animated }}</td>
                            </tr>
                            <tr v-if="pony != null">
                                <td>{{ $t('game_object.pony.pony') }}</td>
                                <td>
                                    <Link
                                        class="link"
                                        :href="`/pony/${pony.id}`"
                                    >
                                        {{ translateName(pony) }}
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">{{ $t('price_history.title') }}</h2>
                <PriceHistory :object="avatar.id" :priceHistory="priceHistory"></PriceHistory>
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
