<script lang="ts" setup>
import { createAssetUrl } from '@/scripts/assets';
import { getObject, translateName } from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import VLazyImage from "v-lazy-image";
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    object: GameObjectId | GameObject | null,
    type?: 'preview' | 'main',
}>(), {
    type: 'main',
})

const objectInfo = computed(() => getObject(props.object))

const image = computed(() => {
    return objectInfo.value?.image[props.type].path
})

const name = computed(() => {
    let name = translateName(objectInfo.value).value
    return name
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
