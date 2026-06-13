<script setup lang="ts">
import DiscordButton from '@/components/buttons/socials/DiscordButton.vue';
import GitHubButton from '@/components/buttons/socials/GitHubButton.vue';
import links from '@/globals/links';
import { Config } from 'vike-vue/Config';
</script>

<template>
    <Config :title="$t('contact.title')" :description="$t('contact.description')"></Config>
    <div class="contact-container">
        <section class="contact-section">
            <h1>{{ $t('contact.title') }}</h1>
            <p class="subtitle">{{ $t('contact.description') }}</p>
            <div class="cards-grid">
                <div class="contact-card">
                    <h3>{{ $t('contact.message.discord.title') }}</h3>
                    <p>{{ $t('contact.message.discord.description') }}</p>
                    <DiscordButton
                        :href="links.discordServer"
                        target="_blank"
                        class="contact-button"
                    >
                        {{ $t('contact.message.discord.button') }}
                    </DiscordButton>
                </div>
                <div class="contact-card">
                    <h3>{{ $t('contact.message.github.title') }}</h3>
                    <p>{{ $t('contact.message.github.description') }}</p>

                    <GitHubButton
                        :href="links.githubRepo"
                        target="_blank"
                        class="contact-button"
                    >
                        {{ $t('contact.message.github.button') }}
                    </GitHubButton>
                </div>
                <div class="contact-card">
                    <h3>{{ $t('contact.message.mlp_game_hangout.title') }}</h3>
                    <p>{{ $t('contact.message.mlp_game_hangout.description') }}</p>

                    <DiscordButton
                        :href="links.mlpGameHangoutServer"
                        target="_blank"
                        class="contact-button"
                    >
                        {{ $t('contact.message.discord.button') }}
                    </DiscordButton>
                </div>
            </div>
        </section>
        <section class="contact-section">
            <h2>{{ $t('contact.message.help_wanted.title') }}</h2>
            <p>{{ $t('contact.message.help_wanted.description') }}</p>
        </section>
    </div>
</template>


<style scoped>
.contact-section {
    margin-bottom: 1rem;
}

.cards-grid {
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, 20rem);
    gap: 0.5rem;
    margin-top: 2rem;
}

.contact-card {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
    /* max-width: 20rem; */
    padding: 1rem;
    text-align: center;
    background-color: white;
    --box-shadow: inset 0px -1px 4px hsl(211, 30%, 80%);
    box-shadow: var(--box-shadow);
    border-radius: 0.8rem;

    transition: box-shadow 150ms ease-out,
                transform 150ms ease-out;
}

.contact-card:has(.contact-button:hover) {
    box-shadow: var(--box-shadow),
                0px 0px 5px hsl(211, 30%, 30%);
    transform: scale(105%);
}

.contact-button:hover:hover {
    transform: revert;
}
</style>
