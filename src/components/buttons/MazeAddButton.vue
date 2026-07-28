<script setup lang="ts">
import { getMazePony, getObject } from '@/scripts/gameData'
import { useSaveStore } from '@/stores/saveManager'
import type { GameObjectId } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { computed } from 'vue'

const props = defineProps<{
  mazePony: string,
  subtract?: boolean,
}>()

const saveStore = useSaveStore()
const mazePony = computed(() => getMazePony(props.mazePony))
const subtract = computed(() => props.subtract)

const owned = computed(() => {
    return saveStore.getMazePonyFights(mazePony.value.id) > 0
})

function toggleOwned(event: Event) {
    if (owned.value) {
        if (subtract.value) {
            saveStore.subtractMazePony(mazePony.value.id)
        } else {
            saveStore.removeMazePony(mazePony.value.id)
        }
    } else {
        saveStore.addMazePony(mazePony.value.id)
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
