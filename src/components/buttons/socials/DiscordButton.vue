<script setup lang="ts">
import type { AnchorHTMLAttributes } from 'vue';
import SocialButton from './SocialButton.vue';
import discordLogo from '@/assets/images/logos/discord/discord-symbol-light-blurple.svg'

const props = defineProps<{
    href: string,
    target?: AnchorHTMLAttributes['target'],
}>()

</script>

<template>
    <SocialButton
        :href="props.href"
        alt="Discord Logo"
        :src="discordLogo"
        :target="props.target"
        class="discord-button"
    >
        <slot></slot>
    </SocialButton>
</template>

<style lang="css" scoped>

.discord-button {
    --background: #5865F2;
    background-color: var(--background);
    color: #E0E3FF;
}

.discord-button:hover {
    background-color: hsl(from var(--background) h s calc(l + 5));
}
</style>
