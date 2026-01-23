<script setup lang="ts">
import { language } from '@/globals'
import { LOCALES } from '@/i18n'
import absoluteUrl from '@/scripts/absoluteUrl'
import SidebarView from '@/views/SidebarView.vue'
import { Head } from 'vike-vue/Head'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'

const pageContext = usePageContext()

</script>

<template>
    <!-- <Config :title="$t('site.title')" :description="$t('site.description')"></Config> -->
    <Head>
        <meta name="theme-color" content="#FF6B9B" />

        <link
            v-for="locale in Object.keys(LOCALES).filter(code => code !== language.code)"
            rel="alternate"
            :hreflang="locale"
            :href="absoluteUrl(
                modifyUrl(
                    pageContext.urlOriginal,
                    {
                        pathname: `/${locale}${pageContext.urlPathname}`
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
        <meta property="og:url" :content="absoluteUrl(pageContext.urlOriginal)" />
    </Head>

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
