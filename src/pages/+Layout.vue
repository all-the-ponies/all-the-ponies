<script setup lang="ts">
import { language } from '@/globals'
import { LOCALES } from '@/i18n'
import absoluteUrl from '@/scripts/absoluteUrl'
import { Head } from 'vike-vue/Head'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'
import Notices from './Notices.vue'
import SidebarView from './SidebarView.vue'

const pageContext = usePageContext()

</script>

<template>
    <Head>
        <meta name="theme-color" content="#FF6B9B" />

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

    <div id="main" class="page" ref="main">
        <SidebarView />
        <main class="router">
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
        height: 100dvh;
    }

    .router {
        margin-inline: auto;
        width: 100%;
    }
}
</style>
