<script setup lang="ts">
import Link from '@/components/Link.vue';
import { Config } from 'vike-vue/Config';

const discordLink = "https://discord.gg/vk4KaFFggS"
const githubRepo = "https://github.com/all-the-ponies/all-the-ponies/"
const mlpGameHangoutLink = "https://discord.gg/Hbf9U8WfZk"
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
                    <Link :href="discordLink" target="_blank" class="contact-button discord-button">
                        <img src="@/assets/images/logos/discord/discord-symbol-white.svg" alt="Discord Logo" class="contact-logo">
                        {{ $t('contact.message.discord.button') }}
                    </Link>
                </div>
                <div class="contact-card">
                    <h3>{{ $t('contact.message.github.title') }}</h3>
                    <p>{{ $t('contact.message.github.description') }}</p>
                    <Link :href="githubRepo" target="_blank" class="contact-button github-button">
                        <img src="@/assets/images/logos/github/github-symbol-white.svg" alt="GitHub Logo" class="contact-logo">
                        {{ $t('contact.message.github.button') }}
                    </Link>
                </div>
                <div class="contact-card">
                    <h3>{{ $t('contact.message.mlp_game_hangout.title') }}</h3>
                    <p>{{ $t('contact.message.mlp_game_hangout.description') }}</p>
                    <Link :href="discordLink" target="_blank" class="contact-button discord-button">
                        <img src="@/assets/images/logos/discord/discord-symbol-white.svg" alt="Discord Logo" class="contact-logo">
                        {{ $t('contact.message.mlp_game_hangout.button') }}
                    </Link>
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

.contact-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: bold;
    color: white;
}

.discord-button { background-color: #5865F2; }
.github-button { background-color: #333; }

.contact-logo {
    object-fit: contain;
    object-position: center;
    height: 1em;
}
</style>
