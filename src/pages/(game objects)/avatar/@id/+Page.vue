<script setup lang="ts">
import { computed } from 'vue';
import gameData from '@/scripts/gameData'
import BackButton from '@/components/buttons/BackButton.vue';
import { staticImage } from '@/scripts/common';
import { usePageContext } from 'vike-vue/usePageContext';
import { Config } from 'vike-vue/Config';
import absoluteUrl from '@/scripts/absoluteUrl';
import Link from '@/components/Link.vue';
import { useData } from 'vike-vue/useData';
import type { AvatarType, DecorType } from '@/types/gameDataTypes';


const pageContext = usePageContext()
const data = useData<{avatar: AvatarType}>()

const objectInfo = computed(() => data.avatar)

const name = computed(() => {
    let name = gameData.translateName(objectInfo.value).value
    return name
})

const pony = computed(() => gameData.getObject(objectInfo.value.pony, 'pony'))

</script>

<template>
    <Config :title="name" description="" :image="absoluteUrl(staticImage(objectInfo.image.preview))"></Config>

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
                            <td>{{ $t('game_object.profile_decorations.is_default') }}</td>
                            <td>{{ objectInfo.is_default }}</td>
                        </tr>
                        <tr v-if="pony != null">
                            <td>{{ $t('game_object.pony.pony') }}</td>
                            <td>
                                <Link
                                    class="link"
                                    :href="`/pony/${pony.id}`"
                                >
                                    {{ gameData.translateName(pony) }}
                                </Link>
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
