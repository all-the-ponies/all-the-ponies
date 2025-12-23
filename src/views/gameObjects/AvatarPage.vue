<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import gameData from '@/scripts/gameData'
import { language } from '@/main';
import ObjectImage from '@/components/ObjectImage.vue'
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { AvatarType, Location, PonyType } from '@/types/gameDataTypes'
import { formatTime } from '@/scripts/common'
import BackButton from '@/components/BackButton.vue';
import { useHead } from '@unhead/vue'



const route = useRoute()

const objectInfo = ref<AvatarType | null>(null)

objectInfo.value = gameData.getObject(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id, 'avatar')

onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        objectInfo.value = gameData.getObject(Array.isArray(to.params.id) ? to.params.id[0] : to.params.id, 'avatar')
    }
})


const name = computed(() => {
    let name = gameData.translateName(objectInfo.value).value
    return name
})

const pony = computed(() => gameData.getObject(objectInfo.value.pony, 'pony'))

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
                            <td>{{ $t('game_object.profile_decorations.is_default') }}</td>
                            <td>{{ objectInfo.is_default }}</td>
                        </tr>
                        <tr v-if="pony != null">
                            <td>{{ $t('game_object.pony.pony') }}</td>
                            <td>
                                <router-link
                                 class="link"
                                 :to="{
                                    name: 'pony',
                                    params: {
                                        id: pony.id,
                                    }
                                 }">
                                    {{ gameData.translateName(pony) }}
                                </router-link>
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
    display: flex;
    flex-wrap: wrap;
}

.residents img {
    object-fit: contain;
    object-position: center;
    height: 5rem;
}

</style>
