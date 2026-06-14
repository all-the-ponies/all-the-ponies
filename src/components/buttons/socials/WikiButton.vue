<script setup lang="ts">
import wikiLogo from '@/assets/images/logos/wiki/wiki-symbol.png';
import type { AnchorHTMLAttributes } from 'vue';
import SocialButton from './SocialButton.vue';

const props = defineProps<{
    href: string,
    target?: AnchorHTMLAttributes['target'],
}>()

</script>

<template>
    <SocialButton
        :href="props.href"
        alt="MLP Game Wiki Logo"
        :src="wikiLogo"
        :target="props.target"
        class="wiki-button"
    >
        <slot></slot>
    </SocialButton>
</template>

<style lang="css" scoped>

.wiki-button {
    --background: #4909a9;
    background-color: var(--background);
}

.wiki-button:hover {
    background-color: hsl(from var(--background) h s calc(l + 5));
}
</style>
