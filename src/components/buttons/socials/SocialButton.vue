<script setup lang="ts">
import Link from '@/components/Link.vue';
import type { AnchorHTMLAttributes, ImgHTMLAttributes } from 'vue';


const props = withDefaults(defineProps<{
    href: string,
    target?: AnchorHTMLAttributes['target'],
    src: ImgHTMLAttributes['src'],
    alt?: ImgHTMLAttributes['alt'],
}>(), {
    target: '_blank',
})

</script>

<template>
    <Link :href="props.href" :target="props.href" class="social-button">
        <img :src="props.src" :alt="props.alt" class="social-logo">
        <slot></slot>
    </Link>
</template>

<style lang="css" scoped>
.social-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: bold;
    color: white;
    
    transition: background-color 150ms linear,
                transform 150ms ease-in-out;
}

.social-button:hover {
    transform: scale(1.1);
}

.social-logo {
    object-fit: contain;
    object-position: center;
    height: 1em;
}
</style>
