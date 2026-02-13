<script setup lang="ts">
import type { AnchorHTMLAttributes } from 'vue';
import SocialButton from './SocialButton.vue';
import githubLogo from '@/assets/images/logos/github/github-symbol-white.svg'

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
    background-color: #333;
}
</style>
