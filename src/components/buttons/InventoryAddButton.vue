<script setup lang="ts">
import { getObject } from '@/scripts/gameData'
import { useSaveStore } from '@/stores/saveManager'
import type { GameObjectId } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { computed } from 'vue'

const props = defineProps<{
  gameObject: GameObjectId,
}>()

const saveStore = useSaveStore()
const gameObject = computedAsync(async () => await getObject(props.gameObject))

const owned = computed(() => {
    switch (gameObject.value?.category) {
        case 'pony':
            return saveStore.hasPony(gameObject.value.id)
        case 'shop':
            return saveStore.hasShop(gameObject.value.id)
        case 'costume':
            return Object.values(gameObject.value.parts).every(part => !part || saveStore.costumeParts.has(part))
        case 'costume_part':
            return saveStore.costumeParts.has(gameObject.value.id)
        case 'avatar':
            return saveStore.avatars.has(gameObject.value.id)
        case 'avatar_frame':
            return saveStore.avatarFrames.has(gameObject.value.id)
        case 'background':
            return saveStore.backgrounds.has(gameObject.value.id)
        case 'background_frame':
            return saveStore.backgroundFrames.has(gameObject.value.id)
        case 'cutie_mark':
            return saveStore.cutieMarks.has(gameObject.value.id)
    }
})

function toggleOwned(event: Event) {
    // event.preventDefault()
    // event.stopPropagation()
    if (owned.value) {
        switch (gameObject.value?.category) {
            case 'pony':
                saveStore.removePony(gameObject.value.id)
                break
            case 'shop':
                saveStore.removeShop(gameObject.value.id)
                break
            case 'avatar':
                saveStore.avatars.delete(gameObject.value.id)
                break
            case 'costume':
                saveStore.removeCostume(gameObject.value.id)
                break
            case 'costume_part':
                saveStore.costumeParts.delete(gameObject.value.id)
                break
            case 'avatar_frame':
                saveStore.avatarFrames.delete(gameObject.value.id)
                break
            case 'background':
                saveStore.backgrounds.delete(gameObject.value.id)
                break
            case 'background_frame':
                saveStore.backgroundFrames.delete(gameObject.value.id)
                break
            case 'cutie_mark':
                saveStore.cutieMarks.delete(gameObject.value.id)
                break
        }
    } else {
        switch (gameObject.value?.category) {
            case 'pony':
                saveStore.addPony(gameObject.value.id)
                break
            case 'shop':
                saveStore.addShop(gameObject.value.id)
                break
            case 'costume':
                saveStore.addCostume(gameObject.value.id)
                break
            case 'costume_part':
                saveStore.costumeParts.add(gameObject.value.id)
                break
            case 'avatar':
                saveStore.avatars.add(gameObject.value.id)
                break
            case 'avatar_frame':
                saveStore.avatarFrames.add(gameObject.value.id)
                break
            case 'background':
                saveStore.backgrounds.add(gameObject.value.id)
                break
            case 'background_frame':
                saveStore.backgroundFrames.add(gameObject.value.id)
                break
            case 'cutie_mark':
                saveStore.cutieMarks.add(gameObject.value.id)
                break
        }
    }
}
</script>

<template>
    <ClientOnly>
        <button
            class="button-circle inventory-button"
            :class="owned ? 'button-red' : 'button-green'"
            @click.stop.prevent="toggleOwned"
        >{{ owned ? '−' : '+' }}</button>
    </ClientOnly>
</template>

<style lang="css" scoped>
.inventory-button {
    font-size: 115%;
}
</style>
