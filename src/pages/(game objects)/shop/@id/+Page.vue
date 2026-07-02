<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { getFortuneShopData, getObject, translateName, useGameObject } from '@/scripts/gameData'
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { Location, PonyType, ShopType } from '@/types/gameDataTypes'
import { formatTime } from '@/scripts/timeFunctions';
import BackButton from '@/components/buttons/BackButton.vue';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';
import { LOCATIONS } from '@/scripts/categories';
import { usePageContext } from 'vike-vue/usePageContext';
import { Config } from 'vike-vue/Config';
import absoluteUrl from '@/scripts/absoluteUrl';
import Link from '@/components/Link.vue';
import { useData } from 'vike-vue/useData';
import PriceHistory from '@/components/tables/PriceHistory.vue';
import type { PriceHistoryType } from '@/scripts/api.types';
import ObjectPage from '@/layouts/ObjectPage.vue';
import FortuneShopTable from '@/components/tables/FortuneShopTable.vue';
import { createAssetUrl } from '@/scripts/assets';
import { computedAsync } from '@vueuse/core';
import { any } from '@/scripts/common';
import { useBasePrice } from '@/composables/useBasePrice';

const pageContext = usePageContext()
const data = useData<{shop: ShopType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const shop = computed(() => data.shop)

const basePrice = useBasePrice(shop, priceHistory)

const name = computed(() => {
    let name = translateName(shop.value).value
    return name
})

const residents = computed(() => {
    const residents: {[ L in Location ]+?: PonyType[]} = {}
    for (let ponyId of shop.value.residents) {
        let pony = getObject(ponyId, 'pony')
        if (!(pony.location in residents)) {
            residents[pony.location] = []
        }
        residents[pony.location].push(pony)
    }

    return residents
})

const visitors = computed(() => shop.value.visitors.map((id) => getObject(id, 'pony')))

const product = computed(() => getObject(shop.value.product, 'consumable'))

const productCurrency = computed(() => {
    if (product.value?.consume.bits) {
        return 'Bits'
    } else if (product.value?.consume.gems) {
        return 'Gems'
    } else {
        return null
    }
})

const fortuneShopData = computed(() => getFortuneShopData(shop.value.id))

const xpName = translateName(getObject('XP', 'item'))

</script>

<template>
    <Config :title="name" description="" :image="createAssetUrl(shop.image.main.path)"></Config>

    <div>
        <back-button fallback="/search/shops" />
        <div v-if="shop === null">
            House {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="shop">
                <template #image>
                    <div class="shop-container">
                        <img class="full-image" :src="createAssetUrl(shop.image.main.path)" :alt="name">
                    </div>
                </template>
                <template #image-right>
                    <inventory-add-button :gameObject="shop.id"></inventory-add-button>
                </template>
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <Link :href="`https://mlp-game-wiki.no/wiki/${shop.wiki_path}`" class="link" target="_blank">
                                        {{ $t('common.wiki') }}
                                    </Link>
                                </td>
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
                                <td>
                                    {{ $t(LOCATIONS[shop.location].string) }}
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.common.unlock_level') }}</td>
                                <td>{{ shop.unlock_level }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.common.size') }}</td>
                                <td>{{ shop.grid_size }}x{{ shop.grid_size }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.build_time') }}</td>
                                <td>{{ formatTime(shop.build.time) }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.build_skip_cost') }}</td>
                                <td><currency-image object="Gems">{{ shop.build.skip_cost }}</currency-image></td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.build_reward') }}</td>
                                <td><currency-image object="XP">{{ shop.build.xp }}</currency-image></td>
                            </tr>
                            
                            <template v-if="product && any(Object.values(product.consume))">
                                <tr>
                                    <th colspan="2">{{ $t('game_object.shop.product') }}</th>
                                </tr>
                                <tr>
                                    <td>{{ translateName(product) }}</td>
                                    <td><img :src="createAssetUrl(product?.image.main.path)" style="height: 1em;"></td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.shop.production_time') }}</td>
                                    <td>{{ formatTime(product?.time) }}</td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.shop.profit') }}</td>
                                    <td v-if="productCurrency"><currency-image :object="productCurrency">{{ product?.consume.bits || product?.consume.gems || product?.consume.tls }}</currency-image></td>
                                    <td v-else>{{ product.consume.tls }} <img :src="createAssetUrl(product.image.main.path)" style="height: 1em;"></td>
                                </tr>
                                <tr>
                                    <td>{{ xpName }}</td>
                                    <td><currency-image object="XP">{{ product.consume.xp }}</currency-image></td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.building.skip_cost') }}</td>
                                    <td><currency-image object="Gems">{{ product.skip_cost }}</currency-image></td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            
            <section class="section" v-if="Object.keys(residents).length > 0">
                <h2>
                    {{ $t('game_object.house.resident', 2) }}
                </h2>
                <div v-for="(ponies, location) in residents">
                    <h3 v-if="Object.keys(residents).length > 1">{{ $t(LOCATIONS[location].string) }} <br></br></h3>
                    <div class="residents">
                        <Link
                            v-for="pony in ponies"
                            :href="`/${pony.category}/${pony.id}`"
                            class="resident link"
                        >
                            <img :src="createAssetUrl(pony.image.portrait.path)" :alt="translateName(pony).value" :title="translateName(pony).value">
                            <span class="resident-name">{{ translateName(pony) }}</span>
                        </Link>
                    </div>
                </div>
            </section>
            <section class="section" v-if="shop.visitors.length > 0">
                <h2>
                    {{ $t('game_object.house.visitor', 2) }}
                </h2>
                <div>
                    <div class="residents">
                        <Link
                            v-for="pony in visitors"
                            :href="`/${pony.category}/${pony.id}`"
                            class="resident link"
                            >
                            <img :src="createAssetUrl(pony.image.portrait.path)" :alt="translateName(pony).value" :title="translateName(pony).value">
                            <span class="resident-name">{{ translateName(pony) }}</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">{{ $t('price_history.title') }}</h2>
                <PriceHistory :object="shop.id" :priceHistory="priceHistory"></PriceHistory>
            </section>
            <section class="section" v-if="fortuneShopData">
                <h2 class="h2">{{ $t('fortune_shop.title') }}</h2>
                <FortuneShopTable :prices="fortuneShopData.prices"></FortuneShopTable>
            </section>
        </template>
    </div>
</template>

<style lang="css" scoped>

.full-image {
    width: 100%;
    object-fit: contain;
    object-position: center;
}

.shop-container {
    position: relative;
    width: 12rem;
    height: 13rem;
    font-size: 1.7rem;
}

.left-image-container,
.right-image-container {
    --width: 2rem;
    
    height: 100%;
    width: var(--width);
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-content: center;

    /* padding: 0.4rem 0.3rem; */
}
.left-image-container {
    left: 0;
}
.right-image-container {
    right: 0;
}

.left-image-container > *,
.right-image-container > * {
    width: var(--width);
    height: var(--width);
    /*aspect-ratio: 1 / 1;*/

    margin: 0;
}

.residents {
    --item-width: 5rem;

    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--item-width), 1fr));
    /* grid-template-rows: subgrid; */
    gap: 0.8rem;
}

.resident {
    display: grid;
    text-align: center;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    width: 100%;
    justify-items: center;
    align-items: stretch;
    
    img {
        object-fit: contain;
        object-position: center;
        width: var(--item-width);
    }
}


</style>
