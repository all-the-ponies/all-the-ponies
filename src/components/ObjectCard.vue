<script lang="ts" setup>
import VLazyImage from "v-lazy-image"
import InventoryAddButton from "./buttons/InventoryAddButton.vue"

import gameData from '@/scripts/gameData'
import { computed, shallowRef } from 'vue'
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import { shopStore } from "@/stores/shopManager"
import { computedAsync } from "@vueuse/core"
import PriceButton from "./buttons/PriceButton.vue"
import RoyalIcon from "./icons/store/RoyalIcon.vue"
import ObjectImage from "./ObjectImage.vue"
import { staticImage, valueExists } from "@/scripts/common"
import Link from "./Link.vue"
import GameCard from "./GameCard.vue"

const shopManager = shopStore

const props = defineProps<{
    object: GameObjectId | GameObject,
    showPrice?: boolean,
}>()

const gameObject = gameData.getObject(props.object)

const name = computed(() => {
    let name = gameData.translateName(gameObject).value
    return name
})

const image = 'preview' in gameObject.image ? gameObject.image.preview : gameObject.image.main

const canAdd = ['pony', 'shop'].includes(gameObject.category)

// const stars = computed({
//   get() {
//     if (saveStore.hasPony(gameObject.id)) {
//       return saveStore.ponies[gameObject.id].level
//     } else {
//       return 0
//     }
//   },
//   set(stars: 0 | 1 | 2 | 3 | 4 | 5) {
//     saveStore.addPony(gameObject.id, {
//       level: stars,
//     })
//   },
// })


const gettingShopInfo = shallowRef(false)

const shopInfo = computedAsync(
    async () => {
        // console.log('getting shop data for', gameObject.id)
        // return null
        return await shopManager.getShopInfo(gameObject)
    },
    null,
    { evaluating: gettingShopInfo, lazy: true, shallow: true },
)
</script>

<template>
    <GameCard
        :title="name"
        :image="staticImage(image)"
        :alt="name"
        :priceData="!gettingShopInfo && showPrice ? shopInfo : null"
        :href="`/${gameObject.category}/${gameObject.id}/`"
    >
        <template #left>
            <img v-if="gameObject.category === 'pony' && gameObject.pro" loading="lazy" src="@/assets/images/ui/pro-pony.png" />
        </template>
        <template #right>
            <inventory-add-button v-if="canAdd" :gameObject="gameObject.id" />
        </template>
        <template #info>
            <slot name="info"></slot>
        </template>
    </GameCard>
</template>
