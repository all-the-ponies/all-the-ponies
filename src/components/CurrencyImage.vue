<script setup lang="ts">
import type { CategoryName, GameObject } from '@/types/gameDataTypes.ts';
import ObjectImage from './ObjectImage.vue';
import { computed } from 'vue';
import { getObject } from '@/scripts/gameData.ts';
import Link from './Link.vue';
import ConditionalWrap from './ConditionalWrap.vue';

const props = defineProps<{
    object: string | GameObject,
    isLink?: boolean | CategoryName | CategoryName[],
}>()

const gameObject = computed(() => getObject(props.object))
const link = computed(() => {
    if (!props.isLink || !gameObject.value) {
        return
    }

    let categories: CategoryName[] = ['token']
    if (typeof props.isLink === 'string') {
        categories = [props.isLink]
    } else if (Array.isArray(props.isLink)) {
        categories = [...props.isLink]
    }

    if (categories.includes(gameObject.value.category)) {
        return `/${gameObject.value.category}/${gameObject.value.id}/`
    }
})

</script>

<template>
    <slot></slot>&nbsp;<ConditionalWrap :condition="Boolean(link)" :wrapper="Link" :wrapper-props="{
        href: link,
    }"><object-image class="object-image" :object="props.object"></object-image></ConditionalWrap>
</template>

<style lang="css" scoped>
/*
.currency {
    height: 1em;
}
*/

.object-image {
    height: 1em;
    /* width: 1em; */
    object-fit: contain;
    object-position: center;
}

</style>
