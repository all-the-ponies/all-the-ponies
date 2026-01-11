<script setup lang="tsx">
import { useMounted } from '@vueuse/core';


const isMounted = useMounted()

</script>

<template>
    <slot v-if="isMounted"></slot>
    <slot v-else name="placeholder"><div></div></slot>
</template>
