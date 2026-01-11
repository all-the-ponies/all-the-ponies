<script setup lang="ts">
import gameData from '@/scripts/gameData';
import { useSaveStore } from '@/stores/saveManager';
import type { GameObjectId } from '@/types/gameDataTypes';
import { computed } from 'vue';
import ClientOnly from '@/components/ClientOnly.vue';

const props = defineProps<{
  gameObject: GameObjectId,
}>()

const saveStore = useSaveStore()
const gameObject = computed(() => gameData.getObject(props.gameObject))

const owned = computed(() => {
    switch (gameObject.value.category) {
        case 'pony':
            return saveStore.hasPony(gameObject.value.id)
        case 'shop':
            return saveStore.hasShop(gameObject.value.id)
    }
})

function toggleOwned(event: Event) {
    // event.preventDefault()
    if (owned.value) {
        switch (gameObject.value.category) {
            case 'pony':
                saveStore.removePony(gameObject.value.id)
                break
            case 'shop':
                saveStore.removeShop(gameObject.value.id)
                break
        }
    } else {
        switch (gameObject.value.category) {
            case 'pony':
                saveStore.addPony(gameObject.value.id)
                break
            case 'shop':
                saveStore.addShop(gameObject.value.id)
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
            @click.prevent="toggleOwned"
        >{{ owned ? '-' : '+' }}</button>
    </ClientOnly>
</template>

<style lang="css" scoped>
.inventory-button {
    font-size: 130%;
}
</style>
