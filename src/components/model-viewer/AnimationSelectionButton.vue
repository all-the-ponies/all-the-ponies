<script setup lang="ts">
defineProps<{selected: boolean, label: string, disabled?: boolean}>()
defineEmits<{toggle: []}>()
</script>

<template>
    <button type="button" class="button-circle animation-selection"
        :class="selected ? 'button-red' : 'button-green'"
        :aria-label="label" :title="label" :aria-pressed="selected" :disabled="disabled"
        @click.stop.prevent="$emit('toggle')">{{ selected ? '−' : '+' }}</button>
</template>

<style scoped>
.animation-selection {
    flex-shrink: 0;
    /* Same proportions as ATP's InventoryAddButton. */
    font-size: 115%;
}
</style>
