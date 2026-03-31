<script lang="ts" setup>
import gameData from '@/scripts/gameData'
import { computed } from 'vue'
import VLazyImage from "v-lazy-image"
import { language } from '@/globals'
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { staticImage } from '@/scripts/common';

const props = withDefaults(defineProps<{
    object: GameObjectId | GameObject | null,
    type?: 'preview' | 'main',
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
    <span v-if="object === null || !image"></span>
    <VLazyImage v-else :src="staticImage(image)" :alt="name"></VLazyImage>
</template>
<!-- <img v-else :src="staticImage(image)" :alt="name" loading="lazy"> -->

<style lang="css" scoped>

/* .object-image {
    height: 100%;
    object-fit: contain;
    object-position: center;
} */
</style>
