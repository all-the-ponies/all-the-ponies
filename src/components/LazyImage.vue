<script setup lang="ts">
import { computedAsync, isClient, useIntersectionObserver } from '@vueuse/core';
import { computed, nextTick, shallowRef, useTemplateRef, watch, type ImgHTMLAttributes } from 'vue';

const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const props = defineProps<{
    src: ImgHTMLAttributes['src'],
}>()

const src = computed(() => props.src)
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

const url = computed(() => isVisible.value ? src.value : EMPTY_IMAGE)

// const { stop } = useIntersectionObserver(
//     lazyImage,
//     ([entry], observerElement) => {
//         isVisible.value = entry?.isIntersecting || false
//         // console.log(props.src, 'visible?', isVisible.value)
//         if (isVisible.value) {
//             // stop()
//         }
//     }
// )

watch(
    src,
    (before, after) => {
        if (before != after) {
            // Check on next tick to keep showing on instant loads
            nextTick(() => {
                if (!lazyImage.value.complete) {
                    isVisible.value = false
                }
            })
        }
    }
)

function onLoad() {
    isVisible.value = true
}

</script>

<template>
    <img
        ref="lazy-image"
        @load="onLoad"
        @error="onLoad"
        :style="{visibility: isVisible ? 'visible' : 'hidden'}"
        :src="src"
        loading="lazy"
    >
</template>
