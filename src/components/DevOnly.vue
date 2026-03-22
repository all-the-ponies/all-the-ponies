<script setup lang="ts">
import { isLocalhost } from '@/scripts/common';
</script>

<template>
    <template v-if="isLocalhost()">
        <slot></slot>
    </template>
</template>
