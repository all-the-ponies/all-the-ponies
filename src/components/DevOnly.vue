<script setup lang="ts">
import { isDev } from '@/scripts/common';
</script>

<template>
    <template v-if="isDev()">
        <slot></slot>
    </template>
</template>
