<script lang="ts" setup>
import gameData from '@/scripts/gameData'
import { computed, type PropType } from 'vue'
import VLazyImage from "v-lazy-image"
import { language } from '@/main'

const props = defineProps({
    object: {
        type: String,
        required: true,
    },
    type: {
        type: String as PropType<'preview' | 'main' | 'full'>,
        required: false,
        default: 'main',
    }
})

const objectInfo = computed(() => gameData.getObject(props.object))

const image = computed(() => {
    return objectInfo.value.image[props.type]
})

const name = computed(() => {
    let name = objectInfo.value?.name[language.value.key]
    return name
})

</script>

<template>
<v-lazy-image class="object-image" :src="`/images/${image}`" :alt="name"></v-lazy-image>
</template>

<style lang="css" scoped>

/* .object-image {
    height: 100%;
    object-fit: contain;
    object-position: center;
} */
</style>
