<script setup lang="ts">
import LanguageSelector from '@/components/LanguageSelector.vue';
import { RouterLink } from 'vue-router'
import gameData from '@/scripts/gameData'
import { ref } from 'vue';

const sidebarShown = ref<boolean>(false)

const emit = defineEmits<{
    change: [state: boolean],
}>()

function toggleSidebar(e: Event) {
    // emit('change', e.target.checked)

    if ((e.target as HTMLInputElement).checked) {
        document.body.style.overflow = 'hidden !important'
    } else {
        document.body.style.overflow = ''

    }
}


</script>

<template>
    <header>
        <aside class="header">
            <div class="title-bar">
                <label for="sidebar-toggle" class="sidebar-toggle">
                    <input @change="toggleSidebar" type="checkbox" name="sidebar-toggle" id="sidebar-toggle">
                    <label for="sidebar-toggle" aria-label="Toggle sidebar" title="Toggle sidebar"></label>
                </label>
                <div>
                    <router-link class="title" to="/">{{ $t('ALL_THE_PONIES') }}</router-link>
                    <LanguageSelector />
                </div>
            </div>
            <div class="sidebar">
                <nav>
                    <ul id="sidebar-links">
                        <router-link to="/search/ponies/">{{ $t('game_object.pony.pony', 2) }}</router-link>
                        <router-link to="/search/houses/">{{ $t('game_object.house.house', 2) }}</router-link>
                        <router-link to="/search/shops/">{{ $t('game_object.shop.shop', 2) }}</router-link>
                        <router-link to="/search/decor/">{{ $t('game_object.decor.decor', 2) }}</router-link>
                        <router-link to="/search/avatars/">{{ $t('game_object.profile_decorations.avatar.avatar', 2) }}</router-link>
                        <hr class="sidebar-separator">
                        <router-link to="/store/">{{ $t('store.title') }}</router-link>
                        <router-link to="/inventory/">{{ $t('inventory.title') }}</router-link>
                        <router-link to="/stats/">{{ $t('stats.title') }}</router-link>
                        <hr class="sidebar-separator">
                        <router-link to="/quiz/">{{ $t('pony_quiz.title') }}</router-link>
                        <router-link to="/guesser/">{{ $t('guesser.title') }}</router-link>
                        <hr class="sidebar-separator">
                        <router-link to="/about/">{{ $t('about.title') }}</router-link>

                    </ul>
                    <div class="version-numbers">
                        <span id="app-version">{{ $t('game.game_version', {version: gameData.gameVersion}) }}</span>
                        <br>
                        <span id="content-version">{{ $t('game.content_version', {version: gameData.contentVersion}) }}</span>
                    </div>
                </nav>
                <label for="sidebar-toggle" class="sidebar-background"></label>
            </div>
        </aside>
    </header>
</template>

<style scoped>

header {
    --padding-inline: 0.5rem;

    /* max-width: var(--page-width); */
    background-color: var(--pink);
    /* padding: 0.5rem 1rem; */

    color: white;

    text-shadow: var(--text-shadow);
}

header a {
    color: white;
    text-decoration: none;
}

header a:hover, header a:focus-visible {
    /* color: var(--blue); */
}

.title {
    font-size: 2rem;
    display: block;
}

.title:hover, .title:focus {
    color: var(--blue);
}

.header {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    width: max-content;

    height: 100%;
    max-height: 100dvh;
}

.title-bar {
    padding-inline: var(--padding-inline);
    padding-block: 0.5rem;
}

.sidebar-toggle {
    display: none;
}

.sidebar {
    display: block;
    overflow-y: auto;
    height: 100%;
}

.sidebar nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    gap: 0.2rem;
}

.sidebar .version-numbers {
    font-size: 1rem;
    padding-inline: var(--padding-inline);
}

.sidebar ul {
    display: flex;
    flex-direction: column;
}

.sidebar li {
    list-style: none;
    /* margin-block: 0.1rem; */
    width: 100%;
}

.sidebar-separator {
    border: 1px solid white;
}

.sidebar a {
    text-decoration: none;
    color: white;
    /* width: 100%; */
    display: inline-block;
    padding-inline: var(--padding-inline);
    padding-block: 0.3rem;
    text-shadow: var(--text-shadow);
}

.sidebar a.router-link-active {
    /* color: var(--blue); */
}

.sidebar a:hover,
.sidebar a:focus-visible,
.sidebar a.router-link-active {
    text-decoration: none;
    /* color: var(--orange); */
    background-color: rgba(0, 0, 0, 0.2);
}

@media screen and (max-width: 50rem) {
    .title-bar {
        display: flex;
        align-items: center;
        justify-content: flex-start;
    }

    .sidebar-toggle {
        display: inline;
    }

    .sidebar-toggle input {
        display: none;
    }

    .sidebar-toggle > label {
        display: block;

        background-image: url('@/assets/images/ui/hamburger-menu.png');
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;

        width: 3rem;
        height: 3rem;

        cursor: pointer;
    }

    .sidebar-toggle > label:hover {
        filter: brightness(75%);
    }

    .title-bar {
        margin-inline: auto;
        max-width: var(--page-width);
        width: 100%;
    }

    header:has(.sidebar-toggle > input:checked) {
        /* height: 100dvh; */
        overscroll-behavior: contain;
        position: sticky;
        top: 0;
        /* width: 100%; */
        z-index: 99999;
    }

    .header:has(.sidebar-toggle > input:checked) {
        /* height: 100dvh; */
        overscroll-behavior: contain;
    }

    .header {
        position: relative;
        width: 100%;
    }

    .sidebar {
        /* display: none; */
        display: none;
        grid-template-columns: clamp(15rem, 65vw, 25rem) 1fr;
        opacity: 0;

        position: absolute;
        top: 100%;

        width: 100%;

        z-index: 999999;

        height: calc(100dvh - 100%);
    }

    .header:has(.sidebar-toggle > input:checked) .sidebar {
        display: grid;
        opacity: 1;
    }

    .sidebar nav {
        background-color: var(--pink);
    }

    .sidebar .sidebar-background {
        background-color: black;
        opacity: 0;
        width: 100%;
        height: 100%;

        /* transition: opacity 0.3s; */
    }

    .header:has(.sidebar-toggle > input:checked) .sidebar-background {
        opacity: 0.5;
    }
}
</style>
