<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import SidebarView from './views/SidebarView.vue'
import { useScrollLock } from '@vueuse/core';
import { onMounted, useTemplateRef } from 'vue';
const routerView = useTemplateRef('main')
// const pageScrollLocked = useScrollLock(document.body, false)

function lockScroll(state: boolean) {
    console.log('state', state)
    // pageScrollLocked.value = state
}

</script>

<template>
  <div id="main" class="page" ref="main">
    <SidebarView @change="lockScroll" />
    <RouterView class="router" v-slot="{ Component }">
        <component :is="Component" />
    </RouterView>
  </div>
</template>

<style scoped>

#main {
    /* height: 100dvh;
    overflow: auto; */
}

.page {
    min-height: 100dvh;
    display: flex;
    /* background-color: var(--page-background-color); */

    font-family: var(--font-family);
    font-size: var(--font-size);
    color: var(--blue);
}

.router {
    flex-grow: 1;
    /* max-width: var(--page-width); */
    /* margin: 0.5rem auto; */
    padding: 0 1rem;
    position: relative;
    /* height: 100%; */
}

@media screen and (max-width: 700px) {
    .page {
        flex-direction: column;
    }

    .router {
        margin-inline: auto;
        width: 100%;
    }
}
</style>
