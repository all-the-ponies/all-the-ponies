<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import gameData from '@/scripts/gameData'
import { language } from '@/main';
import ObjectImage from '@/components/ObjectImage.vue'
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { HouseType, Location, PonyType, ShopType } from '@/types/gameDataTypes'
import { formatTime } from '@/scripts/common'
import BackButton from '@/components/BackButton.vue';
import { useHead } from '@unhead/vue';
import InventoryAddButton from '@/components/inventory/InventoryAddButton.vue';
import { LOCATIONS } from '@/scripts/categories';


const route = useRoute()

const objectInfo = ref<ShopType | null>(null)

objectInfo.value = gameData.getObject(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id, 'shop')

onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {to
        objectInfo.value = gameData.getObject(Array.isArray(to.params.id) ? to.params.id[0] : to.params.id, 'shop')
    }
})


const name = computed(() => {
    let name = gameData.translateName(objectInfo.value).value
    return name
})

useHead({
    title: name,
})

const residents = computed(() => {
    const residents: {[ L in Location ]+?: PonyType[]} = {}
    for (let ponyId of objectInfo.value.residents) {
        let pony = gameData.getObject(ponyId, 'pony')
        if (!(pony.location in residents)) {
            residents[pony.location] = []
        }
        residents[pony.location].push(pony)
    }

    return residents
})

const productCurrency = computed(() => {
    if (objectInfo.value.product.bits) {
        return 'Bits'
    } else if (objectInfo.value.product.gems) {
        return 'Gems'
    } else {
        return null
    }
})

</script>

<template>
    <div>
        <back-button/>
        <div v-if="objectInfo === null">
            House {{ route.params.id }} not found
        </div>
        <div v-else class="object-profile">
            <div>
                <h1 class="name">
                    {{ name }}
                </h1>
                <div class="shop-container">
                    <img class="full-image" :src="`/images/${objectInfo.image.main}`" :alt="name">
                    <div class="left-image-container">
                    </div>
                    <div class="right-image-container">
                        <inventory-add-button :gameObject="objectInfo.id"></inventory-add-button>
                    </div>
                </div>
            </div>
            <div>
                <table class="infobox">
                    <tbody>
                        <tr>
                            <th colspan="2">{{ $t('common.info') }}</th>
                        </tr>
                        <tr>
                            <td>{{ $t('location.town') }}</td>
                            <td>
                                {{ $t(LOCATIONS[objectInfo.location].string) }}
                            </td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.common.unlock_level') }}</td>
                            <td>{{ objectInfo.unlock_level }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.common.size') }}</td>
                            <td>{{ objectInfo.grid_size }}x{{ objectInfo.grid_size }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.building.build_time') }}</td>
                            <td>{{ formatTime(objectInfo.build.time) }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.building.build_skip_cost') }}</td>
                            <td><currency-image object="Gems">{{ objectInfo.build.skip_cost }}</currency-image></td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.building.build_reward') }}</td>
                            <td><currency-image object="XP">{{ objectInfo.build.skip_cost }}</currency-image></td>
                        </tr>
                        
                        <template v-if="Object.keys(objectInfo.product).length > 0">
                            <tr>
                                <th colspan="2">{{ $t('game_object.shop.product') }}</th>
                            </tr>
                            <tr>
                                <td>{{ objectInfo.product.name[language.key] }}</td>
                                <td><img :src="`/images/${objectInfo.product.image}`" style="height: 1em;"></td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.shop.production_time') }}</td>
                                <td>{{ formatTime(objectInfo.product.time) }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.shop.profit') }}</td>
                                <td v-if="productCurrency"><currency-image :object="productCurrency">{{ objectInfo.product.bits || objectInfo.product.gems || objectInfo.product.tls }}</currency-image></td>
                                <td v-else>{{ objectInfo.product.tls }} <img :src="`/images/${objectInfo.product.image}`" style="height: 1em;"></td>
                            </tr>
                            <tr>
                                <td>{{ gameData.translateName(gameData.getObject('XP', 'item')) }}</td>
                                <td><currency-image object="XP">{{ objectInfo.product.xp }}</currency-image></td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.skip_cost') }}</td>
                                <td><currency-image object="Gems">{{ objectInfo.product.skip_cost }}</currency-image></td>
                            </tr>
                        </template>

                        <tr v-if="Object.keys(residents).length > 0">
                            <th colspan="2">{{ $t('game_object.house.resident', 2) }}</th>
                        </tr>
                        <tr v-for="(ponies, location) in residents">
                            <td>
                                <span v-if="Object.keys(residents).length > 1">{{ $t(LOCATIONS[location].string) }} <br></br></span>
                                <div class="residents">
                                    <router-link
                                        class="resident link"
                                        v-for="pony in ponies"
                                        :to="{
                                            name: pony.category,
                                            params: {
                                                id: pony.id,
                                            }
                                        }"
                                     >
                                     <img :src="`/images/${pony.image.portrait}`" :alt="pony.name[language.key]" :title="pony.name[language.key]">
                                     <span class="resident-name">{{ gameData.translateName(pony) }}</span>
                                    </router-link>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="objectInfo.visitors.length > 0">
                            <th colspan="2">{{ $t('game_object.house.visitor', 2) }}</th>
                        </tr>
                        <tr>
                            <td>
                                <div class="residents">
                                    <router-link
                                        class="resident link"
                                        v-for="pony in objectInfo.visitors.map((id) => gameData.getObject(id, 'pony'))"
                                        :to="{
                                            name: pony.category,
                                            params: {
                                                id: pony.id,
                                            }
                                        }"
                                     >
                                     <img :src="`/images/${pony.image.portrait}`" :alt="pony.name[language.key]" :title="pony.name[language.key]">
                                     <span class="resident-name">{{ gameData.translateName(pony) }}</span>
                                    </router-link>

                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>

.object-profile {
    display: grid;
    grid-template-columns: 50% 50%;
}

@media screen and (max-width: 500px) {
    .object-profile {
        grid-template-columns: auto;
    }
}

.name {
    display: flex;
    align-items: center;
    gap: 0.2em;
}

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
    gap: 0.5rem;
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
}

.resident img {
    object-fit: contain;
    object-position: center;
    width: var(--item-width);
}

</style>
