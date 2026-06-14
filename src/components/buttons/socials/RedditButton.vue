<script setup lang="ts">
import redditLogo from '@/assets/images/logos/reddit/Reddit-symbol-flat.svg';
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
        alt="Reddit Logo"
        :src="redditLogo"
        :target="props.target"
        class="reddit-button"
    >
        <slot></slot>
    </SocialButton>
</template>

<style lang="css" scoped>

.reddit-button {
    --background: #ff4500;
    background-color: var(--background);
}

.reddit-button:hover {
    background-color: hsl(from var(--background) h s calc(l + 5));
}
</style>
