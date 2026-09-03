<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  condition: boolean
  wrapper: string | Component
  wrapperProps?: Record<string, unknown>
}>()
</script>

<template>
  <component :is="wrapper" v-bind="wrapperProps" v-if="condition">
    <slot />
  </component>
  <slot v-else />
</template>
