<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import gameData from '@/scripts/gameData'
import { language } from '@/main';
import ObjectImage from '@/components/ObjectImage.vue'
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { DecorType, Location, PonyType } from '@/types/gameDataTypes'
import { formatTime } from '@/scripts/common'
import BackButton from '@/components/BackButton.vue';
import { useHead } from '@unhead/vue'
import { LOCATIONS } from '@/scripts/categories';



const route = useRoute()

const objectInfo = ref<DecorType | null>(null)

objectInfo.value = gameData.getObject(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id, 'decor')
console.log('decor', objectInfo.value)

onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        objectInfo.value = gameData.getObject(Array.isArray(to.params.id) ? to.params.id[0] : to.params.id, 'decor')
        console.log('decor', objectInfo.value)
    }
})


const name = computed(() => {
    let name = gameData.translateName(objectInfo.value).value
    return name
})

useHead({
    title: name,
})

</script>

<template>
    <div>
        <back-button/>
        <div v-if="objectInfo === null">
            Decor {{ route.params.id }} not found
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
