<script setup lang="ts">
import BackButton from '@/components/buttons/BackButton.vue';
import CurrencyImage from '@/components/CurrencyImage.vue';
import Link from '@/components/Link.vue';
import { language } from '@/globals';
import ObjectPage from '@/layouts/ObjectPage.vue';
import { createAssetUrl } from '@/scripts/assets';
import { LOCATIONS } from '@/scripts/categories';
import gameData, { getObject, translateName } from '@/scripts/gameData';
import { formatTime } from '@/scripts/timeFunctions';
import type { HouseType, Location, PonyType } from '@/types/gameDataTypes';
import { computedAsync } from '@vueuse/core';
import { Config } from 'vike-vue/Config';
import { useData } from 'vike-vue/useData';
import { usePageContext } from 'vike-vue/usePageContext';
import { computed } from 'vue';
import type { Data } from './+data';


const pageContext = usePageContext()
const data = useData<Data>()

const house = computed(() => data.house)


const name = computed(() => {
    let name = translateName(house.value).value
    return name
})

const residents = computed(() => {
    const residents: {[ L in Location ]+?: PonyType[]} = {}
    for (let ponyId of house.value.residents) {
        let pony = getObject(ponyId, 'pony')
        if (!(pony.location in residents)) {
            residents[pony.location] = []
        }
        residents[pony.location].push(pony)
    }

    return residents
})

const visitors = computed(() => {
    return house.value.visitors.map((id) => getObject(id, 'pony'))
})

</script>

<template>
    <Config :title="name" description=""></Config>

    <div>
        <back-button fallback="/search/houses" />
        <div v-if="house === null">
            House {{ pageContext.routeParams.id }} not found
        </div>
        <template v-else>
            <ObjectPage :game-object="house">
                <template #info>
                    <table class="infobox">
                        <tbody>
                            <tr>
                                <th colspan="2">{{ $t('common.info') }}</th>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <Link :href="`https://mlp-game-wiki.no/wiki/${house.wiki_path}`" class="link" target="_blank">
                                        {{ $t('common.wiki') }}
                                    </Link>
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('location.town') }}</td>
                                <td>
                                    {{
                                        new Intl.ListFormat(language.code, {
                                                style: 'short',
                                            })
                                            .format(
                                                house.location
                                                .map((location) => $t(LOCATIONS[location].string))
                                            )
                                    }}
                                </td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.common.size') }}</td>
                                <td>{{ house.grid_size }}x{{ house.grid_size }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.build_time') }}</td>
                                <td>{{ formatTime(house.build.time) }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.build_skip_cost') }}</td>
                                <td><currency-image object="Gems">{{ house.build.skip_cost }}</currency-image></td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.building.build_reward') }}</td>
                                <td><currency-image object="XP">{{ house.build.xp }}</currency-image></td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            <section class="section" v-if="Object.keys(residents).length > 0">
                <h2>
                    {{ $t('game_object.house.resident', 2) }}
                </h2>
                <div v-for="(ponies, location) in residents">
                    <h3 v-if="house.location.length > 1">{{ $t(LOCATIONS[location].string) }} <br></br></h3>
                    <div class="residents">
                        <Link
                            v-for="pony in ponies"
                            :href="`/${pony.category}/${pony.id}`"
                            class="resident link"
                        >
                            <img :src="createAssetUrl(pony.image.portrait.path)" :alt="translateName(pony).value" :title="translateName(pony).value">
                            <span class="resident-name">{{ gameData.translateName(pony) }}</span>
                        </Link>
                    </div>
                </div>
            </section>
            <section class="section" v-if="house.visitors.length > 0">
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
                            <span class="resident-name">{{ gameData.translateName(pony) }}</span>
                        </Link>
                    </div>
                </div>
            </section>
        </template>
    </div>
</template>

<style lang="scss" scoped>

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
