<script setup lang="ts">
import { computed } from 'vue';
import gameData from '@/scripts/gameData'
import { language } from '@/globals';
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { HouseType, Location, PonyType } from '@/types/gameDataTypes'
import { staticImage } from '@/scripts/common'
import { formatTime } from '@/scripts/timeFunctions'
import BackButton from '@/components/buttons/BackButton.vue'
import { LOCATIONS } from '@/scripts/categories'
import { usePageContext } from 'vike-vue/usePageContext'
import { Config } from 'vike-vue/Config'
import absoluteUrl from '@/scripts/absoluteUrl'
import Link from '@/components/Link.vue'
import { useData } from 'vike-vue/useData'
import ObjectPage from '@/layouts/ObjectPage.vue';


const pageContext = usePageContext()
const data = useData<{house: HouseType}>()

const house = computed(() => data.house)


const name = computed(() => {
    let name = gameData.translateName(house.value).value
    return name
})

const residents = computed(() => {
    const residents: {[ L in Location ]+?: PonyType[]} = {}
    for (let ponyId of house.value.residents) {
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
    <Config :title="name" description="" :image="absoluteUrl(staticImage(house.image.main))"></Config>

    <div>
        <back-button/>
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
                            <tr v-if="Object.keys(residents).length > 0">
                                <th colspan="2">{{ $t('game_object.house.resident', 2) }}</th>
                            </tr>
                            <tr v-for="(ponies, location) in residents">
                                <td colspan="2">
                                    <span v-if="house.location.length > 1">{{ $t(LOCATIONS[location].string) }} <br></br></span>
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
                                </td>
                            </tr>
                            <tr v-if="house.visitors.length > 0">
                                <th colspan="2">{{ $t('game_object.house.visitor', 2) }}</th>
                            </tr>
                            <tr>
                                <td colspan="2">
                                    <div class="residents">
                                        <Link
                                            v-for="pony in house.visitors.map((id) => gameData.getObject(id, 'pony'))"
                                            :href="`/${pony.category}/${pony.id}`"
                                            class="resident link"
                                         >
                                            <img :src="staticImage(pony.image.portrait)" :alt="pony.name[language.key]" :title="pony.name[language.key]">
                                            <span class="resident-name">{{ gameData.translateName(pony) }}</span>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>
            </ObjectPage>
            
        </template>
    </div>
</template>

<style lang="css" scoped>

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
    
    img {
        object-fit: contain;
        object-position: center;
        width: var(--item-width);
    }
}

</style>
