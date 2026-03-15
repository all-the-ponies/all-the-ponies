<script setup lang="ts">
import { computed } from 'vue';
import gameData from '@/scripts/gameData'
import { language } from '@/globals';
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { Location, PonyType, ShopType } from '@/types/gameDataTypes'
import { staticImage } from '@/scripts/common'
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

const pageContext = usePageContext()
const data = useData<{shop: ShopType, priceHistory: PriceHistoryType | null}>()
const priceHistory = computed(() => {
    if (!data.priceHistory) {
        return []
    }
    
    return data.priceHistory.price_history.filter(item => !item.hidden)
})

const shop = computed(() => data.shop)

const name = computed(() => {
    let name = gameData.translateName(shop.value).value
    return name
})

const residents = computed(() => {
    const residents: {[ L in Location ]+?: PonyType[]} = {}
    for (let ponyId of shop.value.residents) {
        let pony = gameData.getObject(ponyId, 'pony')
        if (!(pony.location in residents)) {
            residents[pony.location] = []
        }
        residents[pony.location].push(pony)
    }

    return residents
})

const productCurrency = computed(() => {
    if (shop.value.product.bits) {
        return 'Bits'
    } else if (shop.value.product.gems) {
        return 'Gems'
    } else {
        return null
    }
})

</script>

<template>
    <Config :title="name" description="" :image="absoluteUrl(staticImage(shop.image.main))"></Config>

    <div>
        <back-button/>
        <div v-if="shop === null">
            House {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :gameObject="shop">
                <template #image>
                    <div class="shop-container">
                        <img class="full-image" :src="`/images/${shop.image.main}`" :alt="name">
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
                            
                            <template v-if="Object.keys(shop.product).length > 0">
                                <tr>
                                    <th colspan="2">{{ $t('game_object.shop.product') }}</th>
                                </tr>
                                <tr>
                                    <td>{{ shop.product.name[language.key] }}</td>
                                    <td><img :src="`/images/${shop.product.image}`" style="height: 1em;"></td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.shop.production_time') }}</td>
                                    <td>{{ formatTime(shop.product.time) }}</td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.shop.profit') }}</td>
                                    <td v-if="productCurrency"><currency-image :object="productCurrency">{{ shop.product.bits || shop.product.gems || shop.product.tls }}</currency-image></td>
                                    <td v-else>{{ shop.product.tls }} <img :src="`/images/${shop.product.image}`" style="height: 1em;"></td>
                                </tr>
                                <tr>
                                    <td>{{ gameData.translateName(gameData.getObject('XP', 'item')) }}</td>
                                    <td><currency-image object="XP">{{ shop.product.xp }}</currency-image></td>
                                </tr>
                                <tr>
                                    <td>{{ $t('game_object.building.skip_cost') }}</td>
                                    <td><currency-image object="Gems">{{ shop.product.skip_cost }}</currency-image></td>
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
                            <img :src="staticImage(pony.image.portrait)" :alt="pony.name[language.key]" :title="pony.name[language.key]">
                            <span class="resident-name">{{ gameData.translateName(pony) }}</span>
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
                            v-for="pony in shop.visitors.map((id) => gameData.getObject(id, 'pony'))"
                            :href="`/${pony.category}/${pony.id}`"
                            class="resident link"
                            >
                            <img :src="staticImage(pony.image.portrait)" :alt="pony.name[language.key]" :title="pony.name[language.key]">
                            <span class="resident-name">{{ gameData.translateName(pony) }}</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section class="section" v-if="priceHistory.length">
                <h2 class="h2">Price History</h2>
                <PriceHistory :object="shop.id" :priceHistory="priceHistory"></PriceHistory>
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
