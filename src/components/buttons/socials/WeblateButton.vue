<script setup lang="ts">
import type { AnchorHTMLAttributes } from 'vue';
import SocialButton from './SocialButton.vue';
import weblateLogo from '@/assets/images/logos/weblate/weblate-symbol.svg'

const props = defineProps<{
    href: string,
    target?: AnchorHTMLAttributes['target'],
}>()

</script>

<template>
    <SocialButton
        :href="props.href"
        alt="Weblate Logo"
        :src="weblateLogo"
        :target="props.target"
        class="weblate-button"
    >
        <slot></slot>
    </SocialButton>
</template>

<style lang="css" scoped>

.weblate-button {
    --background: #356c65;
    background-color: var(--background);
}

.weblate-button:hover {
    background-color: hsl(from var(--background) h s calc(l + 5));
}
</style>
