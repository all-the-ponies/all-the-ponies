<script lang="ts" setup>
import { createAssetUrl } from '@/scripts/assets';
import { getObject, translateName, useGameObject } from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computedAsync } from '@vueuse/core';
import { computed } from 'vue';
import LazyImage from './LazyImage.vue';

const props = withDefaults(defineProps<{
    object: GameObjectId | GameObject | null,
    type?: string,
}>(), {
    type: 'main',
})

const objectInfo = computed(() => getObject(props.object))

// const objectInfo = computedAsync(async () => await getObject(props.object))

const image = computed(() => {
    if (!objectInfo.value?.image) {
        return
    }
    if (props.type in objectInfo.value?.image) {
        return objectInfo.value?.image[props.type].path
    }
    return objectInfo.value?.image?.main?.path
})

// const name = computed(() => {
//     let name = translateName(objectInfo).value
//     return name
// })

const name = computed(() => {
    return translateName(objectInfo.value).value
})


</script>

<template>
    <span v-if="object === null || !image"></span>
    <LazyImage v-else :src="createAssetUrl(image)" :alt="name" :title="name"></LazyImage>
</template>
<!-- <img v-else :src="staticImage(image)" :alt="name" loading="lazy"> -->

<style lang="css" scoped>

/* .object-image {
    height: 100%;
    object-fit: contain;
    object-position: center;
} */
</style>
