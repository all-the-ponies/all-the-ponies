<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import gameData from '@/scripts/gameData'
import { language } from '@/globals';
import ObjectImage from '@/components/ObjectImage.vue'
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { HouseType, Location, PonyType } from '@/types/gameDataTypes'
import { formatTime } from '@/scripts/common'
import BackButton from '@/components/buttons/BackButton.vue';
import { useHead } from '@unhead/vue';
import { LOCATIONS } from '@/scripts/categories';



const route = useRoute()

const objectInfo = ref<HouseType | null>(null)

objectInfo.value = gameData.getObject(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id, 'house')

onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        objectInfo.value = gameData.getObject(Array.isArray(to.params.id) ? to.params.id[0] : to.params.id, 'house')
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
                <img class="full-image" :src="`/images/${objectInfo.image.main}`" :alt="name">
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
                                {{
                                    new Intl.ListFormat(language.code, {
                                            style: 'short',
                                        })
                                        .format(
                                            objectInfo.location
                                            .map((location) => $t(LOCATIONS[location].string))
                                        )
                                }}
                            </td>
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
                        <tr v-if="Object.keys(residents).length > 0">
                            <th colspan="2">{{ $t('game_object.house.resident', 2) }}</th>
                        </tr>
                        <tr v-for="(ponies, location) in residents">
                            <td colspan="2">
                                <span v-if="objectInfo.location.length > 1">{{ $t(LOCATIONS[location].string) }} <br></br></span>
                                <div class="residents">
                                    <router-link
                                     v-for="pony in ponies"
                                     :to="{
                                        name: pony.category,
                                        params: {
                                            id: pony.id,
                                        }
                                     }"
                                     class="resident link"
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
                            <td colspan="2">
                                <div class="residents">
                                    <router-link
                                     v-for="pony in objectInfo.visitors.map((id) => gameData.getObject(id, 'pony'))"
                                     :to="{
                                        name: pony.category,
                                        params: {
                                            id: pony.id,
                                        }
                                     }"
                                     class="resident link"
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

.portrait {
    height: 1em;
}

.full-image {
    max-height: 10rem;
    object-fit: contain;
    object-position: center;
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
