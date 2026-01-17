<script setup lang="ts">
import SidebarView from '@/views/SidebarView.vue'
</script>

<template>
    <!-- <Config :title="$t('site.title')" :description="$t('site.description')"></Config> -->

  <div id="main" class="page" ref="main">
    <SidebarView />
    <main class="router">
        <slot></slot>
    </main>
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

@media screen and (max-width: 50rem) {
    .page {
        flex-direction: column;
    }

    .router {
        margin-inline: auto;
        width: 100%;
    }
}
</style>
