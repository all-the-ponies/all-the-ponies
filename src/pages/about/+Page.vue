<script setup lang="ts">
import Link from '@/components/Link.vue';
import { language } from '@/globals';
import { Config } from 'vike-vue/Config';
import { useData } from 'vike-vue/useData';
import type { Data } from './+data.server';

const { credits, error: creditsError } = useData<Data>()

console.log('credits', credits)

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
                <li>
                    <i18n-t keypath="about.sections.credits.message.credits_list.1">
                        <template #ego>
                            <Link href="https://github.com/ego-lay-atman-bay" class="link">ego-lay-atman-bay</Link>
                        </template>
                    </i18n-t>
                </li>
                <li>
                    <i18n-t keypath="about.sections.credits.message.credits_list.2">
                        <template #bass>
                            <span class="text-green">Bass</span>
                        </template>
                    </i18n-t>
                </li>
                <li>
                    <i18n-t keypath="about.sections.credits.message.credits_list.3">
                        <template #font>
                            <Link href="https://www.mattyhex.net/CMR/" class="link">Celestia Medium Redux</Link>
                        </template>
                    </i18n-t>
                </li>
                <li>
                    <i18n-t keypath="about.sections.credits.message.credits_list.4">
                        <template #vue>
                            <Link href="https://vuejs.org/" class="link">Vue.js</Link>
                        </template>
                    </i18n-t>
                </li>
            </ul>
            <h2>{{ $t('about.sections.translations.title') }}</h2>
            <ul class="list" v-if="!creditsError">
                <li v-for="user in credits">
                    <span class="text-green">{{ user.full_name }}</span> - 
                    {{
                        new Intl.ListFormat([language.code], {style: 'short'}).format(
                            user.languages.map(lang => 
                                new Intl.DisplayNames([language.code], { type: 'language' }).of(lang.replaceAll('_', '-'))
                            )
                        )
                    }}
                </li>
            </ul>
            <p v-else class="error-message">{{ $t('about.sections.credits.fetch_failed') }}</p>
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

.error-message {
    color: var(--red);
}
</style>
