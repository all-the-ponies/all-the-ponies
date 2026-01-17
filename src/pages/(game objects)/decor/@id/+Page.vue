<script setup lang="ts">
import { computed } from 'vue';
import gameData from '@/scripts/gameData'
import CurrencyImage from '@/components/CurrencyImage.vue'
import BackButton from '@/components/buttons/BackButton.vue';
import { LOCATIONS } from '@/scripts/categories';
import { staticImage } from '@/scripts/common';
import { usePageContext } from 'vike-vue/usePageContext';
import { Config } from 'vike-vue/Config';
import absoluteUrl from '@/scripts/absoluteUrl';
import { useData } from 'vike-vue/useData';
import type { DecorType } from '@/types/gameDataTypes';


const pageContext = usePageContext()
const data = useData<{decor: DecorType}>()

const objectInfo = computed(() => data.decor)


const name = computed(() => {
    let name = gameData.translateName(objectInfo.value).value
    return name
})

</script>

<template>
    <Config :title="name" description="" :image="absoluteUrl(staticImage(objectInfo.image.main))"></Config>

    <div>
        <back-button/>
        <div v-if="objectInfo === null">
            Decor {{ pageContext.routeParams.id }} not found
        </div>
        <div v-else class="object-profile">
            <div>
                <h1 class="name">
                    {{ name }}
                </h1>
                <img class="full-image" :src="staticImage(objectInfo.image.main)" :alt="name">
            </div>
            <div>
                <table class="infobox">
                    <tbody>
                        <tr>
                            <th colspan="2">{{ $t('common.info') }}</th>
                        </tr>
                        <tr>
                            <td>{{ $t('location.town') }}</td>
                            <td>{{ $t(LOCATIONS[objectInfo.location].string) }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.common.size') }}</td>
                            <td>{{ objectInfo.grid_size }}x{{ objectInfo.grid_size }}</td>
                        </tr>
                        <tr>
                            <td>{{ gameData.translateName(gameData.getObject('XP', 'item')) }}</td>
                            <td><currency-image object="XP">{{ $n(objectInfo.xp) }}</currency-image></td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.decor.fusion_points') }}</td>
                            <td>{{objectInfo.fusion_points ? $n(objectInfo.fusion_points) : $t('game_object.decor.cannot_fuse') }}</td>
                        </tr>
                        <template v-if="objectInfo.pro.is_pro">
                            <tr>
                                <td colspan="2">{{ $t('game_object.decor.pro_decor') }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.common.size') }}</td>
                                <td>{{ objectInfo.pro.size }}</td>
                            </tr>
                            <tr>
                                <td>{{ $t('game_object.decor.effect') }}</td>
                                <td v-if="objectInfo.pro.bits">
                                    <currency-image object="Bits">
                                      +{{ objectInfo.pro.bits }}%
                                    </currency-image>
                                </td>
                                <td v-else>
                                    -{{ objectInfo.pro.time }}%
                                    <img src="@/assets/images/ui/timer.png" alt="Cooldown" class="object-image">
                                </td>
                            </tr>
                        </template>
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
    display: flex;
    flex-wrap: wrap;
}

.residents img {
    object-fit: contain;
    object-position: center;
    height: 5rem;
}

</style>
