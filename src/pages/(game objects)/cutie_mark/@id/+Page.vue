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
import type { BackgroundFrameType, BackgroundType, CutieMarkType } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';
import { useBasePrice } from '@/composables/useBasePrice';


const pageContext = usePageContext()
const data = useData<{cutie_mark: CutieMarkType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const cutie_mark = computed(() => data.cutie_mark)

const basePrice = useBasePrice(cutie_mark, priceHistory)

const name = computed(() => {
    let name = translateName(cutie_mark.value).value
    return name
})

const pony = computed(() => getObject(cutie_mark.value?.pony))

const fortuneShopData = computed(() => getFortuneShopData(cutie_mark.value?.id))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(cutie_mark.image.main.path)"></Config>

    <div>
        <back-button fallback="/search/cutie_marks" />
        <div v-if="cutie_mark === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="cutie_mark">
                <template #image-right>
                    <InventoryAddButton :gameObject="cutie_mark.id"></InventoryAddButton>
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
                                <td>{{ cutie_mark.is_default }}</td>
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
                <PriceHistory :object="cutie_mark.id" :priceHistory="priceHistory"></PriceHistory>
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
