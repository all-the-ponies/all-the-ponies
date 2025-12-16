<script lang="ts" setup>
import VLazyImage from "v-lazy-image"
import { i18n, language } from '@/main'
import { LOCALES } from '@/i18n'
import { RouterLink } from 'vue-router'
import InventoryAddButton from "./inventory/InventoryAddButton.vue"

import gameData from '@/scripts/gameData'
import { computed } from 'vue'
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import { staticImage } from "@/scripts/common"
import { useSaveStore } from "@/stores/saveManager"
import Stars from "./Stars.vue"

const props = defineProps<{
    object: GameObjectId | GameObject,
}>()

const saveStore = useSaveStore()

const gameObject = gameData.getObject(props.object)

// console.log('object', object, props.object)

const name = computed(() => {
    let name = gameData.translateName(gameObject).value
    return name
})

const image = 'preview' in gameObject.image ? gameObject.image.preview : gameObject.image.main

const canAdd = ['pony', 'shop'].includes(gameObject.category)

const stars = computed({
  get() {
    if (saveStore.hasPony(gameObject.id)) {
      return saveStore.ponies[gameObject.id].level
    } else {
      return 0
    }
  },
  set(stars: 0 | 1 | 2 | 3 | 4 | 5) {
    console.log('setting stars', stars)
    saveStore.addPony(gameObject.id, {
      level: stars,
    })
  }
})
</script>

<template>
    <div class="object-card">
        <RouterLink :to="{
            name: gameObject.category,
            params: {
                id: gameObject.id,
            }
        }">
            <span class="object-name">
                {{ name }}
            </span>
            <div class="card-body">
                <v-lazy-image :src="`/images/${image}`" :alt="name" class="object-image" />
                <div class="left-container">
                    <img v-if="gameObject.category === 'pony' && gameObject.pro" loading="lazy" src="@/assets/images/ui/pro-pony.png" />
                    <!-- <v-lazy-image v-if="gameObject.category === 'pony' && gameObject.pro" loading="lazy" @intersect="this.src" :src="() => import('@/assets/images/ui/pro-pony.png')" /> -->
                </div>
                <div class="right-container">
                    <inventory-add-button v-if="canAdd" :gameObject="gameObject.id" />
                </div>
            </div>
        </RouterLink>
    </div>
</template>

<style lang="css" scoped>
.object-card {
    left: 0px;
    background-color: white;

    width: var(--grid-size, 10rem);
    height: calc(var(--grid-size, 10rem) * (4 / 3));
    aspect-ratio: 3 / 4;

    border-radius: 0.8rem;
    --box-shadow: inset 0px -1px 4px hsl(211, 30%, 80%);
    box-shadow: var(--box-shadow);

    cursor: pointer;
    container-type: inline-size;
    text-decoration: none;

    transition: box-shadow 150ms ease-out,
                scale 150ms ease-out;
}

.object-card:hover,
.object-card:focus {
    box-shadow: var(--box-shadow),
                0px 0px 5px hsl(211, 30%, 30%);
    scale: 105%;
}

.add-button {
    visibility: visible;
}

.object-card:hover .add-button {
    visibility: visible;
}

a {
    border-radius: inherit;
    text-decoration: none;
}

.object-name {
    font-size: 10cqw;
    word-break: break-word;
    text-shadow: var(--text-shadow);

    color: white;
    text-align: center;
    display: grid;
    align-items: center;
    width: 100%;
    height: 20%;
    background-image: linear-gradient(var(--pink-light), var(--pink));
    /* box-shadow: 0px 1px 0px 1px var(--pink-dark); */
    border-bottom: 2px solid var(--pink-dark);
    
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

.card-body {
    width: 100%;
    height: 80%;
    position: relative;
}

.object-image-container {
    width: 100%;
    height: 100%;
}

.object-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    padding: 1rem;
}

.left-container,
.right-container {
    height: 100%;
    width: 2rem;
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-content: center;

    padding: 0.4rem 0.3rem;
}
.left-container {
    left: 0;
}
.right-container {
    right: 0;
}

.left-container > *,
.right-container > * {
    width: 1.5rem;
    height: 1.5rem;

    margin: 0;
}
</style>
