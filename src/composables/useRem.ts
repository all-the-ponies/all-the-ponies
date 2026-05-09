import { useElementSize, useMounted } from "@vueuse/core";
import { computed, onMounted, ref, toValue, watch, watchEffect, type MaybeRefOrGetter } from "vue";


// Currently not listening for font size changes
// If I want to listen for font size changes
// FontSizeObserver: https://github.com/arturbien/browser-font-size-observer/blob/main/src/index.ts
// I don't listen right now because let's be real, no one is changing
// their font size while keeping the page open


export function useRem(rem: MaybeRefOrGetter<number>) {
    const isMounted = useMounted()

    const size = computed(() => {
        let fontSize = 16

        if (isMounted.value) {
            fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        }

        return fontSize * toValue(rem)
    })
    
    return size
}
