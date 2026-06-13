<script setup lang="ts">
import { fixUrl } from '@/scripts/fixUrl';
import { usePageContext } from 'vike-vue/usePageContext';
import { computed, type AnchorHTMLAttributes } from 'vue';

const pageContext = usePageContext()

const props = defineProps<{
  href: AnchorHTMLAttributes['href'],
  download?: AnchorHTMLAttributes['download'],
  hreflang?: AnchorHTMLAttributes['hreflang'],
  media?: AnchorHTMLAttributes['media'],
  ping?: AnchorHTMLAttributes['ping'],
  rel?: AnchorHTMLAttributes['rel'],
  target?: AnchorHTMLAttributes['target'],
  type?: AnchorHTMLAttributes['type'],
  referrerpolicy?: AnchorHTMLAttributes['referrerpolicy'],
}>()

const isActive = computed(() => {
  const urlPathname = pageContext.urlPathname
  return props.href === '/' ? urlPathname === props.href : urlPathname.startsWith(props.href)
})

const transformedHref = computed(() => fixUrl(props.href))
</script>

<template>
  <a
    :class="{ 'a-active': isActive }"
    v-bind="{
      ...props,
      href: transformedHref,
    }"
  >
    <slot></slot>
  </a>
</template>

<style scoped>

</style>
