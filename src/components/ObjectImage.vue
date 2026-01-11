<script lang="ts" setup>
import gameData from '@/scripts/gameData'
import { computed } from 'vue'
import VLazyImage from "v-lazy-image"
import { language } from '@/globals'
import type { GameObjectId } from '@/types/gameDataTypes';

const props = withDefaults(defineProps<{
    object: GameObjectId | null,
    type?: 'preview' | 'main' | 'full',
}>(), {
    type: 'main',
})

const objectInfo = computed(() => gameData.getObject(props.object))

const image = computed(() => {
    return objectInfo.value?.image[props.type]
})

const name = computed(() => {
    let name = objectInfo.value?.name[language.value.key]
    return name
})

</script>

<template>
    <span v-if="object === null"></span>
    <v-lazy-image v-else :src="`/images/${image}`" :alt="name"></v-lazy-image>
</template>

<style lang="css" scoped>

/* .object-image {
    height: 100%;
    object-fit: contain;
    object-position: center;
} */
</style>
