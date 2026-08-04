<script setup lang="ts">
import { language } from '@/globals'
import { LOCALES } from '@/i18n'
import absoluteUrl from '@/scripts/absoluteUrl'
import { Head } from 'vike-vue/Head'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'
import Notices from './Notices.vue'
import SidebarView from './SidebarView.vue'
import { onMounted, ref, useTemplateRef } from 'vue'
import { getGameVersions, type GameVersion } from '@/scripts/gameData.ts'
import { useElementSize } from '@vueuse/core'

const pageContext = usePageContext()

// const showGameUpdate = ref<boolean>(false)

onMounted(() => {
    const currentVersion = getGameVersions()
//     const rawPreviousVersion = localStorage.getItem('game_version')
//     if (rawPreviousVersion) {
//         const previousVersion: GameVersion = JSON.parse(rawPreviousVersion)
// 
//         if (previousVersion.game_version != currentVersion.game_version) {
//             showGameUpdate.value = true
//         } else if (previousVersion.content_version != currentVersion.content_version) {
//             
//         }
//     } else {
//         showGameUpdate.value = true
//     }

    localStorage.setItem('game_version', JSON.stringify(currentVersion))
})

const sidebarRef = useTemplateRef('sidebar')
const { height: sidebarHeight } = useElementSize(sidebarRef)

</script>

<template>
    <Head>
        <meta name="application-name" :content="$t('site.title')">

        <link rel="canonical" :href="absoluteUrl(
                modifyUrl(
                    pageContext.urlOriginal,
                    {
                        search: null,
                    }
                )
            )" />
        
        <link rel="alternate" hreflang="x-default" :href="absoluteUrl(
                modifyUrl(
                    pageContext.urlOriginal,
                    {
                        pathname: pageContext.urlPathname,
                        search: null,
                    }
                )
            )" />
        
        <link
            v-for="locale in Object.keys(LOCALES)"
            rel="alternate"
            :hreflang="locale"
            :href="absoluteUrl(
                modifyUrl(
                    pageContext.urlOriginal,
                    {
                        pathname: `/${locale}${pageContext.urlPathname}`,
                        search: null,
                    }
                )
            )"
        />

        <meta property="og:locale" :content="language.code.replace('-', '_')" />
        <meta
            v-for="locale in Object.keys(LOCALES).filter(code => code !== language.code)"
            property="og:locale:alternate"
            :content="locale.replace('-', '_')"
        />
        
        <meta property="og:type" content="website" />
        <meta property="og:site_name" :content="$t('site.title')" />
        <meta property="og:url" :content="absoluteUrl(
                modifyUrl(
                    pageContext.urlOriginal,
                    {
                        pathname: pageContext.urlPathname,
                        search: {
                            __original_path: null,
                        },
                    }
                )
            )" />
    </Head>

    <a href="#content" class="skip-to-content button button-blue">{{ $t('site.skip_to_content') }}</a>

    <div id="main" class="page" ref="main">
        <SidebarView ref="sidebar" />
        <main class="router" id="content">
            <Notices></Notices>
            <slot></slot>
        </main>
    </div>
</template>

<style lang="css">

.page-fill {
    min-height: 100%;
}

.section {
    margin-block: 1rem;
}

.h2 {
    margin-block: 0.5rem;
}

</style>

<style scoped>

.skip-to-content {
    position: fixed;
    top: 0;
    z-index: 9999999;
    transform: translateY(calc(-100% - 1rem));

    transition: transform 200ms ease;
}

.skip-to-content:hover,
.skip-to-content:focus,
.skip-to-content:focus-visible {
    transform: translateY(0%);
}

.page {
    min-height: 100dvh;
    /* height: 100%; */
    display: flex;
    /* background-color: var(--page-background-color); */

    font-family: var(--font-family);
    font-size: var(--font-size);
    color: var(--blue);
}

.router {
    flex-grow: 1;
    /* max-width: var(--page-width); */
    margin: 0.5rem auto;
    padding: 0 1rem;
    position: relative;
    /* height: 100%; */
    margin: 1rem;
}

@media screen and (max-width: 50rem) {
    .page {
        flex-direction: column;
        height: calc(100dvh - (v-bind('sidebarHeight') * 1px));
    }

    .router {
        margin-inline: auto;
        width: 100%;
    }
}
</style>
