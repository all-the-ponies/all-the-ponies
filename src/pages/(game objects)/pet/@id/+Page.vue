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
import type { BackgroundFrameType, BackgroundType, CutieMarkType, PetType } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';


const pageContext = usePageContext()
const data = useData<{pet: PetType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const pet = computed(() => data.pet)

const basePrice = computed(() => {
    const result = {
        token: pet.value.price?.token,
        tokens: null,
        currency: pet.value.price?.base.currency,
        price: pet.value.price?.base.amount,
        dailyGoals: pet.value.price?.daily_goals,
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
    let name = translateName(pet.value).value
    return name
})

const pony = computed(() => getObject(pet.value.pony))

const fortuneShopData = computed(() => getFortuneShopData(pet.value.id))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(pet.image.main.path)"></Config>

    <div>
        <back-button fallback="/search/pets" />
        <div v-if="pet === null">
            Pet {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="pet">
                <template #left-info>
                    <div class="bonus-info">
                        <img src="@/assets/images/ui/icons/minecart-icon.png" alt="Minecart bonus">
                        +{{ $n(pet.minecart_bonus / 100, {style: 'percent'}) }}
                        <img src="@/assets/images/ui/icons/quest-book.png" alt="Quest bonus">
                        -{{ $n(pet.minecart_bonus / 100, {style: 'percent'}) }}
                    </div>
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
                            <tr v-if="pony">
                                <td>{{ $t('game_object.pony.pony') }}</td>
                                <td><Link :href="`/pony/${pony.id}/`" class="link">{{ translateName(pony) }}</Link></td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">{{ $t('price_history.title') }}</h2>
                <PriceHistory :object="pet.id" :priceHistory="priceHistory"></PriceHistory>
            </section>
            <section class="section" v-if="fortuneShopData">
                <h2 class="h2">{{ $t('fortune_shop.title') }}</h2>
                <FortuneShopTable :prices="fortuneShopData.prices"></FortuneShopTable>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

.bonus-info {
    font-size: 1.6rem;
    margin-block: 1rem;
}

.bonus-info img {
    height: 1em;
    object-fit: contain;
    object-position: center;
}

</style>
