<script setup lang="ts">
import { ref, useSlots, computed, type VNode, type VNodeChild } from 'vue';
import { usePageContext } from 'vike-vue/usePageContext';
import SidebarItem from './SidebarItem.vue';
 
const props = defineProps<{
    expanded?: boolean,
}>()
 
const slots = useSlots()
const pageContext = usePageContext()
 
function normalize(path: string): string {
    return path.endsWith('/') ? path : path + '/'
}
 
// Walks the vnode tree produced by this submenu's default slot and collects
// every `href` prop it finds — including hrefs nested inside other
// SidebarSubmenus. This runs synchronously inside setup(), before anything
// is rendered, so it produces the same result on the server and the client
// (unlike a "children register themselves on mount" approach, which would
// only work after the client has hydrated).
function collectHrefs(vnodes: VNodeChild): string[] {
    if (!vnodes) return []
    const list = Array.isArray(vnodes) ? vnodes : [vnodes]
    const hrefs: string[] = []
 
    for (const vnode of list) {
        if (vnode == null || typeof vnode !== 'object') continue
 
        const href = (vnode as VNode).props?.href
        if (typeof href === 'string') hrefs.push(href)
 
        const children = (vnode as VNode).children
        if (Array.isArray(children)) {
            hrefs.push(...collectHrefs(children as VNodeChild))
        } else if (children && typeof children === 'object' && 'default' in children && typeof (children as any).default === 'function') {
            hrefs.push(...collectHrefs((children as any).default()))
        }
    }
 
    return hrefs
}
 
const hasActiveDescendant = computed<boolean>(() => {
    const currentPath = normalize(pageContext.urlPathname)
    const hrefs = collectHrefs(slots.default?.())
    return hrefs.some((href) => currentPath.startsWith(normalize(href)))
})
 
const expanded = ref<boolean>(props.expanded || hasActiveDescendant.value)
 
 
function toggleExpand() {
    expanded.value = !expanded.value
}

</script>

<template>
    <SidebarItem>
        <button
            class="menu-title"
            :class="{
                expanded: expanded,
                active: hasActiveDescendant,
            }"
            @click="toggleExpand()"
        >
            <slot name="title" required></slot>
        </button>
        <ul class="submenu" :class="{expanded: expanded}" ref="submenu">
            <div class="submenu-inner">
                <slot></slot>
            </div>
        </ul>
    </SidebarItem>
</template>

<style lang="css" scoped>

.menu-title {
    position: relative;
    display: inline-block;
    width: 100%;
    padding-block: 0.2rem;
    padding-inline: var(--padding-inline);
    padding-right: calc(1.5em + var(--padding-inline));

    font-size: var(--font-size);
    font-family: var(--font-family);
    text-align: left;
    color: white;
    text-shadow: var(--text-shadow);
    
    background: none;
    border: none;

    cursor: pointer;
}

.menu-title:hover,
.menu-title:focus-visible,
.menu-title.active {
    background-color: rgba(0, 0, 0, 0.2);
}

.menu-title::after {
    content: "";
    position: absolute;

    width: 0.5em;
    height: 0.5em;
    border-right: 2px solid white;
    border-bottom: 2px solid white;

    right: 20px;
    top: 50%;

    transform: translate(0, -50%) rotate(-45deg);
    transition: transform 200ms ease;
}

.menu-title.expanded::after {
    transform: translate(0, -50%) rotate(45deg);
}

.submenu {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 200ms ease-in-out;
    
    padding-left: 1.5rem;
}

.submenu.expanded {
    grid-template-rows: 1fr;
}

.submenu-inner {
    overflow: hidden;
    min-height: 0;
}

</style>
