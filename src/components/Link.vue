<script lang="ts" setup>
import { RouterLink, type RouteLocationAsPathGeneric, type RouteLocationAsRelativeGeneric } from 'vue-router'

const props = defineProps<{
  to: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric,
}>()

</script>

<template>
<router-link :to="props.to"><slot></slot></router-link>
</template>