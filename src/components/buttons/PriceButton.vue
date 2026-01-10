<script setup lang="ts">
import type { GameObjectId } from '@/types/gameDataTypes';
import ObjectImage from '../ObjectImage.vue';


const props = defineProps<{
    currency: GameObjectId | null,
}>()


</script>

<template>
    <button class="price-button button button-green">
        <slot></slot>
        <ObjectImage class="currency-image" :object="props.currency"></ObjectImage>
    </button>
</template>

<style lang="css">

.price-button {
    position: relative;
    min-width: 6rem;
    font-size: 0.8em;
    min-height: 1.6rem;
}

.currency-image {
    width: 1.6rem;
    height: 1.6rem;
    position: absolute;
    right: -5px;
    top: -2px;
    object-position: center;
    object-fit: contain;
}

</style>
