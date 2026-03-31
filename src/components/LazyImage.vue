<script setup lang="ts">
import { computedAsync, useIntersectionObserver } from '@vueuse/core';
import { computed, shallowRef, useTemplateRef, type ImgHTMLAttributes } from 'vue';

const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const props = defineProps<{
    src: ImgHTMLAttributes['src'],
}>()

const lazyImage = useTemplateRef('lazy-image')
const isVisible = shallowRef<boolean>(false)

// const url = computedAsync(
//     async () => {
//         if (isVisible.value) {
//             return await import(props.src)
//         } else {
//             return EMPTY_IMAGE
//         }
//     },
//     EMPTY_IMAGE,
// )

const url = computed(() => isVisible.value ? props.src : EMPTY_IMAGE)

const { stop } = useIntersectionObserver(
    lazyImage,
    ([entry], observerElement) => {
        isVisible.value = entry?.isIntersecting || false
        // console.log(props.src, 'visible?', isVisible.value)
        if (isVisible.value) {
            stop()
        }
    }
)

</script>

<template>
    <img ref="lazy-image" :src="props.src" loading="lazy">
</template>
