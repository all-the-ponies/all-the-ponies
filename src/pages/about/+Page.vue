<script setup lang="ts">
import { Config } from 'vike-vue/Config'
import Link from '@/components/Link.vue'
import { language } from '@/globals';

</script>

<template>
    <Config :title="$t('about.title')"></Config>
    <div>
        <section>
            <h1>{{ $t('about.title') }}</h1>
            <i18n-t keypath="about.description.body" tag="p">
                <template #me>
                    <Link href="https://github.com/ego-lay-atman-bay/" class="link">ego-lay-atman-bay</Link>
                </template>
                <template #quiz_link>
                    <Link href="/quiz/" class="link">{{ $t('about.description.quiz_link') }}</Link>
                </template>
            </i18n-t>
        </section>
        
        <section>
            <h2>{{ $t('about.sections.credits.title') }}</h2>
            <ul class="list">
                <li>The website is built by <Link href="https://github.com/ego-lay-atman-bay" class="link">ego-lay-atman-bay</Link>.</li>
                <li>Thanks to <span class="text-green">Bass</span> for help with loading ponies with a friend code.</li>
                <li>The font used is <Link href="https://www.mattyhex.net/CMR/" class="link">Celestia Medium Redux</Link>, which is also used in the game.</li>
                <li>The website was built using <Link href="https://vuejs.org/" class="link">Vue.js</Link> to make my life easier and allow for a more dynamic experience.</li>
            </ul>
            <h2>{{ $t('about.sections.translations.title') }}</h2>
            <ul class="list">
                <li><span class="text-green">Pamcezya</span> - {{ new Intl.DisplayNames([language.code], { type: "language" }).of('tr') }}</li>
                <li><span class="text-green">Double Dove</span> - {{ new Intl.DisplayNames([language.code], { type: "language" }).of('zh') }}</li>
            </ul>
        </section>
    </div>
</template>

<style lang="css">
section {
    margin-block: 1rem;
}

.list li {
      margin-left: 1rem;
}
</style>
