<script setup lang="ts">
import githubLogo from '@/assets/images/logos/github/github-symbol-white.svg';
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
        alt="GitHub Logo"
        :src="githubLogo"
        :target="props.target"
        class="github-button"
    >
        <slot></slot>
    </SocialButton>
</template>

<style lang="css" scoped>

.github-button {
    --background: #333;
    background-color: var(--background);
}

.github-button:hover {
    background-color: hsl(from var(--background) h s calc(l + 5));
}
</style>
