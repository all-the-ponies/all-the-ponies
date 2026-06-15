<script lang="ts" setup>
import { createAssetUrl } from '@/scripts/assets';
import { getObject, translateName, useGameObject } from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computedAsync } from '@vueuse/core';
import VLazyImage from "v-lazy-image";
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    object: GameObjectId | GameObject | null,
    type?: 'preview' | 'main',
}>(), {
    type: 'main',
})

const objectId = computed(() => props.object)
const objectInfo = useGameObject(objectId)

// const objectInfo = computedAsync(async () => await getObject(props.object))

const image = computed(() => {
    return objectInfo.value?.image[props.type].path
})

// const name = computed(() => {
//     let name = translateName(objectInfo).value
//     return name
// })

const name = computed(() => {
    return translateName(objectInfo.value)
})


</script>

<template>
    <span v-if="object === null || !image"></span>
    <VLazyImage v-else :src="createAssetUrl(image)" :alt="name"></VLazyImage>
</template>
<!-- <img v-else :src="staticImage(image)" :alt="name" loading="lazy"> -->

<style lang="css" scoped>

/* .object-image {
    height: 100%;
    object-fit: contain;
    object-position: center;
} */
</style>
