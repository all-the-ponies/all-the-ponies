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
import type { AvatarFrameType, AvatarType, DecorType } from '@/types/gameDataTypes';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';
import { useBasePrice } from '@/composables/useBasePrice';
import type { Data } from './+data';


const pageContext = usePageContext()
const data = useData<Data>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const avatar_frame = computed(() => data.avatar_frame)

const basePrice = useBasePrice(avatar_frame, priceHistory)

const name = computed(() => {
    let name = translateName(avatar_frame.value).value
    return name
})

const fortuneShopData = computed(() => getFortuneShopData(avatar_frame.value?.id))

</script>

<template>
    <Config :title="name" description=""></Config>

    <div>
        <back-button fallback="/search/avatar_frames" />
        <div v-if="avatar_frame === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="avatar_frame">
                <template #image-right>
                    <InventoryAddButton :gameObject="avatar_frame.id"></InventoryAddButton>
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
                                <td>{{ avatar_frame.is_default }}</td>
                            </tr>
                            <tr v-if="avatar_frame.animated">
                                <td>{{ $t('game_object.profile_decorations.avatar.animated') }}</td>
                                <td>{{ avatar_frame.animated }}</td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">{{ $t('price_history.title') }}</h2>
                <PriceHistory :object="avatar_frame.id" :priceHistory="priceHistory"></PriceHistory>
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
