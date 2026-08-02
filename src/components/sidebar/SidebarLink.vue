<script setup lang="ts">
import type { AnchorHTMLAttributes } from 'vue';
import Link from '../Link.vue';
import SidebarItem from './SidebarItem.vue';


const props = defineProps<{
    href: AnchorHTMLAttributes['href']
}>()

</script>

<template>
    <SidebarItem>
        <Link :href="props.href" class="sidebar-link">
            <slot></slot>
        </Link>
    </SidebarItem>
</template>

<style lang="css" scoped>

.sidebar-link {
    display: inline-block;
    width: 100%;
    padding-block: 0.2rem;
    text-decoration: none;
    color: white;
    padding-inline: var(--padding-inline);
    text-shadow: var(--text-shadow);
}

.sidebar-link:hover,
.sidebar-link:focus-visible,
.sidebar-link.a-active {
    text-decoration: none;
    background-color: rgba(0, 0, 0, 0.2);
}

</style>
