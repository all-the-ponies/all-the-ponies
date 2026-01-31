<script setup lang="ts">
import { language } from '@/globals';
import { LOCALES } from '@/i18n';
import { usePageContext } from 'vike-vue/usePageContext'
import { useAttrs, computed, type AnchorHTMLAttributes } from 'vue'

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

const transformedHref = computed(() => {
  if (props.href.includes('://')) {
    return props.href
  }

  let pathParts = props.href.split('/')
  if (pathParts[0] in LOCALES || pathParts[1] in LOCALES) {
    return props.href
  }
  return `/${language.value.code}${props.href}`
})
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
