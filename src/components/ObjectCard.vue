<script lang="ts" setup>
import InventoryAddButton from "./buttons/InventoryAddButton.vue"

import { createAssetUrl } from "@/scripts/assets.ts"
import { getObject, useGroupQuests, translateName, getCollection } from '@/scripts/gameData'
import { shopStore } from "@/stores/shopManager"
import type { GameObject, GameObjectId } from "@/types/gameDataTypes"
import { computedAsync } from "@vueuse/core"
import { computed, shallowRef } from 'vue'
import AddToListButton from "./buttons/AddToListButton.vue"
import GameCard from "./GameCard.vue"
import CollectionButton from "./buttons/CollectionButton.vue"

const shopManager = shopStore
const groupQuests = useGroupQuests()

const props = defineProps<{
    object: GameObjectId | GameObject,
    showPrice?: boolean,
    isLink?: boolean,
    hasButtons?: boolean,
    hover?: boolean,
}>()

const gameObject = computed(() => getObject(props.object))


const name = computed(() => {
    let name = translateName(gameObject.value).value
    return name
})

const image = computed(() => gameObject.value ? ('preview' in gameObject.value?.image ? gameObject.value.image.preview.path : gameObject.value.image.main.path) : null)

const canAdd = computed(() => [
    'pony',
    'shop',
    'costume',
    'costume_part',
    'avatar',
    'avatar_frame',
    'background',
    'background_frame',
    'cutie_mark'
].includes(gameObject.value?.category))

const showProIcon = computed(() => {
    if (gameObject.value?.category != 'pony') {
        return false
    }

    let showPro = false

    for (let id of gameObject.value?.pro) {
        if (id === 'random') {
            showPro = true
            break
        }
        if (!groupQuests.value?.quests[id].special) {
            showPro = true
            break
        }
    }
    return showPro
})

const collectionLink = computed(() => {
    if (gameObject.value.category !== 'pony' || !Array.isArray(gameObject.value.collections)) {
        return null
    }
    
    const collections = gameObject.value.collections.filter(collectionId => {
        const collection = getCollection(collectionId)
        return !(collection.tags?.includes('unused') || collection.tags?.includes('vip'))
    })

    if (collections.length === 0) {
        return null
    } else if (collections.length === 1) {
        return `/collection/${collections[0]}`
    }
    return `/search/collections/?q=${gameObject.value.id}`
})

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
        if (gameObject.value) {
            return await shopManager.getShopInfo(gameObject.value)
        }
    },
    null,
    { evaluating: gettingShopInfo, lazy: true, shallow: true },
)
</script>

<template>
    <GameCard
        class="object-card"
        :title="name || ''"
        :image="createAssetUrl(image)"
        :alt="name || ''"
        :priceData="!gettingShopInfo && showPrice ? shopInfo : null"
        :href="gameObject && props.isLink ? `/${gameObject.category}/${gameObject.id}/` : null"
        :hover="props.hover"
    >
        <template #left>
            <CollectionButton v-if="collectionLink" :href="collectionLink"></CollectionButton>
            <img v-if="showProIcon" loading="lazy" src="@/assets/images/ui/pro-pony.png" />
        </template>
        <template #right>
            <inventory-add-button v-if="gameObject && props.hasButtons && canAdd" :gameObject="gameObject?.id" />
            <AddToListButton v-if="gameObject && props.hasButtons" :gameObject="gameObject?.id"></AddToListButton>
        </template>
        <template #info>
            <slot name="info"></slot>
        </template>
    </GameCard>
</template>
