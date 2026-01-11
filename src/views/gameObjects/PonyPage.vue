<script setup lang="ts">
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import gameData from '@/scripts/gameData'
import { language } from '@/globals';
import CurrencyImage from '@/components/CurrencyImage.vue'
import type { PonyType } from '@/types/gameDataTypes'
import { formatTime } from '@/scripts/common'
import StarRewards from '@/components/StarRewards.vue'
import { useHead } from '@unhead/vue';
import BackButton from '@/components/buttons/BackButton.vue';
import InventoryAddButton from '@/components/buttons/InventoryAddButton.vue';
import { useSaveStore } from '@/stores/saveManager';
import Stars from '@/components/Stars.vue';
import { LOCATIONS } from '@/scripts/categories';
import { useMounted } from '@vueuse/core';

const isMounted = useMounted()

const route = useRoute()

const pony = ref<PonyType | null>(null)

const saveStore = useSaveStore()
pony.value = gameData.getObject(Array.isArray(route.params.id) ? route.params.id[0] : route.params.id, 'pony')

const stars = computed({
  get() {
    if (!isMounted.value) {
        return 0
    }

    if (saveStore.hasPony(pony.value.id)) {
      return saveStore.ponies[pony.value.id].level
    } else {
      return 0
    }
  },
  set(stars: 0 | 1 | 2 | 3 | 4 | 5) {
    saveStore.addPony(pony.value.id, {
      level: stars,
    })
  }
})

onBeforeRouteUpdate((to, from) => {
    if (to.params.id !== from.params.id) {
        pony.value = gameData.getObject(Array.isArray(to.params.id) ? to.params.id[0] : to.params.id, 'pony')
    }
})


const name = computed(() => {
    let name = gameData.translateName(pony.value).value
    return name
})

const description = computed(() => {
    let description = pony.value?.description[language.value.key]
    return description
})

const house = computed(() => gameData.getObject(pony.value?.house))
const houseName = computed(() => house.value?.name[language.value.key])

useHead({
    title: () => name.value,
})

</script>

<template>
    <div>
        <back-button/>
        <div v-if="pony === null">
            Pony {{ route.params.id }} not found
        </div>
        <div v-else class="object-profile">
            <div>
                <h1 class="name">
                    <img class="portrait" :src="`/images/${pony.image.portrait}`" :alt="name">
                    {{ name }}
                </h1>
                <div class="character-wrapper">
                    <div class="character-container">
                        <Stars
                            class="stars"
                            v-model="stars"
                            interractive
                        >
                            <img class="full-image" :src="`/images/${pony.image.main}`" :alt="name">
                            <div class="left-image-container">
                                <img v-if="pony.pro" loading="lazy" src="@/assets/images/ui/pro-pony.png" />
                            </div>
                            <div class="right-image-container">
                                <inventory-add-button :gameObject="pony.id"></inventory-add-button>
                            </div>
                        </Stars>
                        <router-link v-if="pony.changeling.id" :to="{
                            name: 'pony',
                            params: {
                                id: pony.changeling.id,
                            }
                        }" class="button button-blue">{{ $t('game_object.pony.transform') }}</router-link>
                    </div>
                </div>
                <div class="description">{{ description }}</div>
            </div>
            <div>
                <table class="infobox">
                    <tbody>
                        <tr>
                            <th colspan="2">{{ $t('common.info') }}</th>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <a :href="`https://mlp-game-wiki.no/index.php/${pony.wiki_path}`" class="link" target="_blank">
                                    {{ $t('common.wiki') }}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.common.unlock_level') }}</td>
                            <td>{{ pony.unlock_level }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('location.town') }}</td>
                            <td>{{ $t(LOCATIONS[pony.location].string) }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.pony.arrival_bonus') }}</td>
                            <td>
                                {{ pony.arrival_xp }}
                                <currency-image object="XP" />
                            </td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.house.house') }}</td>
                            <td>
                                <router-link
                                v-if="house !== null"
                                 class="link"
                                 :to="{
                                    name: 'house',
                                    params: {
                                        id: house.id
                                    }
                                }">{{ houseName }}</router-link>
                            </td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.pony.minigame_cooldown') }}</td>
                            <td>{{ formatTime(pony.minigame.cooldown) }}</td>
                        </tr>
                        <tr>
                            <td>{{ $t('game_object.pony.minigame_skip_cost') }}</td>
                            <td>
                                {{ pony.minigame.skip_cost }} <currency-image class="item" object="Gems" />
                            </td>
                        </tr>
                        <tr v-if="pony.pro">
                           	<td>{{ $t('group_quests.pro') }}</td>
                           	<td>{{ pony.pro === 'random' ? $t('group_quests.random_pro') : gameData.data.group_quests.quests[pony.pro].name[language.key] }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" class="table-header">{{ $t('game_object.pony.level_up_rewards') }}</td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <span v-if="pony.max_level || pony.rewards.length == 0" class="none-star-rewards">None</span>
                                <star-rewards
                                    v-if="!pony.max_level && pony.rewards.length > 0"
                                    :rewards="pony.rewards"
                                    v-model="stars"
                                ></star-rewards>
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
    overflow-wrap: anywhere;
}

.portrait {
    height: 1em;
}

.full-image {
    /*max-height: 10rem;*/
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

.character-wrapper {
    display: flex;
    flex-direction: column;
    align-items: start;
}

.character-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stars {
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

</style>
