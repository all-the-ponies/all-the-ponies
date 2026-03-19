<script setup lang="ts">
import { fixUrl } from '@/scripts/fixUrl';
import { computed } from 'vue';
import { navigate } from 'vike/client/router'


const props = defineProps<{
    fallback?: string
}>()

const fallbackUrl = computed(() => {
    if (!props.fallback) {
        return null
    }
    return fixUrl(props.fallback)
})

function goBack() {
    if (fallbackUrl.value && window.navigation != undefined && !window.navigation.canGoBack) {
        navigate(fallbackUrl.value)
    } else {
        history.back()
    }
}
</script>

<template>
    <button @click="goBack" class="back-button button-circle button-blue">←</button>
</template>

<style lang="css" scoped>
.back-button {
    font-size: 2rem;
}
</style>
