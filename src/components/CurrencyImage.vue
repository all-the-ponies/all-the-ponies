<script setup lang="ts">
import ObjectImage from './ObjectImage.vue'

const props = defineProps({
    object: {
        type: String,
        required: true,
    }
})

</script>

<template>
<span class="currency">
    <slot></slot> <object-image class="object-image" :object="props.object"></object-image>
</span>
</template>

<style lang="css">

.currency {
    height: 1em;
}

.object-image {
    height: 1em;
    /* width: 1em; */
    object-fit: contain;
    object-position: center;
}

</style>
