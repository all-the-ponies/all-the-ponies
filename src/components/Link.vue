<script setup>
import { language } from '@/globals';
import { LOCALES } from '@/i18n';
import { usePageContext } from 'vike-vue/usePageContext'
import { useAttrs, computed } from 'vue'

const pageContext = usePageContext()
const { href } = defineProps({
  href: String,
})
const isActive = computed(() => {
  const urlPathname = pageContext.urlPathname
  return href === '/' ? urlPathname === href : urlPathname.startsWith(href)
})

const transformedHref = computed(() => {
  if (href.includes('://')) {
    return href
  }

  let pathParts = href.split('/')
  if (pathParts[0] in LOCALES || pathParts[1] in LOCALES) {
    return href
  }
  return `/${language.value.code}${href}`
})
</script>

<template>
  <a :href="transformedHref" :class="{ 'a-active': isActive }">
    <slot></slot>
  </a>
</template>

<style scoped>

</style>
