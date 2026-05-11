<script setup lang="ts">
import type { AnchorHTMLAttributes } from 'vue';
import SocialButton from './SocialButton.vue';
import kofiLogo from '@/assets/images/logos/kofi/kofi-symbol.webp'

const props = defineProps<{
    href: string,
    target?: AnchorHTMLAttributes['target'],
}>()

</script>

<template>
    <SocialButton
        :href="props.href"
        alt="Kofi Logo"
        :src="kofiLogo"
        :target="props.target"
        class="kofi-button"
    >
        <slot></slot>
    </SocialButton>
</template>

<style lang="css" scoped>

.kofi-button {
    --background: #FF6433;
    background-color: var(--background);
}

.kofi-button:hover {
    background-color: hsl(from var(--background) h s calc(l + 5));
}
</style>
