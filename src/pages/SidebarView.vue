<script setup lang="ts">
import CustomScrollbar from '@/components/CustomScrollbar.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import Link from '@/components/Link.vue'
import SidebarLabel from '@/components/sidebar/SidebarLabel.vue'
import SidebarLink from '@/components/sidebar/SidebarLink.vue'
import SidebarRoot from '@/components/sidebar/SidebarRoot.vue'
import SidebarSeparator from '@/components/sidebar/SidebarSeparator.vue'
import SidebarSubmenu from '@/components/sidebar/SidebarSubmenu.vue'
import { useGameVersions } from '@/scripts/gameData'
import { ref } from 'vue'

const sidebarShown = ref<boolean>(false)
const gameVersions = useGameVersions()

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
                    <Link class="title" href="/">{{ $t('site.title') }}</Link>
                    <LanguageSelector />
                </div>
            </div>
            <div class="sidebar-container">
                <label for="sidebar-toggle" class="sidebar-background"></label>
                <CustomScrollbar class="sidebar-scroller">
                    <SidebarRoot>
                        <SidebarLabel>{{ $t('sidebar.game_info') }}</SidebarLabel>
                        <SidebarSubmenu>
                            <template #title>{{ $t('sidebar.browse') }}</template>
                            <SidebarLink href="/search/ponies/">{{ $t('game_object.pony.pony', 2) }}</SidebarLink>
                            <SidebarLink href="/search/houses/">{{ $t('game_object.house.house', 2) }}</SidebarLink>
                            <SidebarLink href="/search/shops/">{{ $t('game_object.shop.shop', 2) }}</SidebarLink>
                            <SidebarLink href="/search/decor/">{{ $t('game_object.decor.decor', 2) }}</SidebarLink>
                            <SidebarLink href="/search/pets/">{{ $t('game_object.pet.pet', 2) }}</SidebarLink>
                            <SidebarLink href="/search/costumes/">{{ $t('game_object.costume.costume', 2) }}</SidebarLink>
                            <SidebarSubmenu>
                                <template #title>{{ $t('sidebar.profile_decorations') }}</template>
                                <SidebarLink href="/search/avatars/">{{ $t('game_object.profile_decorations.avatar.avatar', 2) }}</SidebarLink>
                                <SidebarLink href="/search/avatar_frames/">{{ $t('game_object.profile_decorations.avatar_frame.avatar_frame', 2) }}</SidebarLink>
                                <SidebarLink href="/search/backgrounds/">{{ $t('game_object.profile_decorations.background.background', 2) }}</SidebarLink>
                                <SidebarLink href="/search/background_frames/">{{ $t('game_object.profile_decorations.background_frame.background_frame', 2) }}</SidebarLink>
                                <SidebarLink href="/search/cutie_marks/">{{ $t('game_object.profile_decorations.cutie_mark.cutie_mark', 2) }}</SidebarLink>
                            </SidebarSubmenu>
                            <SidebarLink href="/search/tokens/">{{ $t('game_object.token.token', 2) }}</SidebarLink>
                            <SidebarLink href="/search/collections/">{{ $t('collection.collection', 2) }}</SidebarLink>
                        </SidebarSubmenu>
                        <SidebarLink href="/events/maze/">{{ $t('maze.title.short') }}</SidebarLink>
                        <SidebarLink href="/store/">{{ $t('store.title') }}</SidebarLink>
                        <SidebarSeparator />
                        <SidebarLabel>{{ $t('sidebar.player') }}</SidebarLabel>
                        <SidebarLink href="/stats/">{{ $t('stats.title') }}</SidebarLink>
                        <SidebarLink href="/inventory/">{{ $t('inventory.title') }}</SidebarLink>
                        <SidebarLink href="/lists/">{{ $t('lists.title') }}</SidebarLink>
                        <SidebarSeparator />
                        <SidebarLabel>{{ $t('sidebar.activities') }}</SidebarLabel>
                        <SidebarLink href="/quiz/">{{ $t('pony_quiz.title') }}</SidebarLink>
                        <SidebarLink href="/guesser/">{{ $t('guesser.title') }}</SidebarLink>
                        <SidebarSeparator />
                        <SidebarLink href="/about/">{{ $t('about.title') }}</SidebarLink>
                        <SidebarLink href="/contact/">{{ $t('contact.title') }}</SidebarLink>
        
                        <template #footer>
                            <div class="version-numbers">
                                <span id="app-version">{{ $t('game.game_version', {version: gameVersions?.game_version}) }}</span>
                                <br>
                                <span id="content-version">{{ $t('game.content_version', {version: gameVersions?.content_version}) }}</span>
                            </div>
                        </template>
                    </SidebarRoot>
                </CustomScrollbar>
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

.sidebar-container {
    display: block;
    height: 100%;
    overflow: hidden;
}

.sidebar-scroller {
    background-color: var(--pink);
}

.sidebar-container .version-numbers {
    font-size: 1rem;
    padding-inline: var(--padding-inline);
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

    .sidebar-container {
        /* display: contents; */
        /* opacity: 0; */
        visibility: hidden;

        position: absolute;
        top: 100%;

        width: 100%;

        z-index: 999999;

        height: calc(100dvh - 100%);

        transition: visibility 0.3s;
    }

    .header:has(.sidebar-toggle > input:checked) .sidebar-container {
        visibility: visible;
        /* display: grid; */
        opacity: 1;
    }

    .sidebar-container .sidebar-background {
        display: block;
        visibility: hidden;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        background-color: black;
        opacity: 0;

        transition: 0.3s opacity, 0.3s visibility ;
    }

    .header:has(.sidebar-toggle > input:checked) .sidebar-background {
        /* display: block; */
        visibility: visible;
        opacity: 0.5;
        @starting-style {
            opacity: 0;
        }
    }

    .sidebar-scroller {
        width: clamp(15rem, 65vw, 25rem);
        transform: translate(-100%, 0);
        transition: transform 0.3s ease;
    }

    .header:has(.sidebar-toggle > input:checked) .sidebar-scroller {
        transform: translate(0, 0);
    }

    /* @starting-style {
        .sidebar-container .sidebar-background {
            opacity: 0;
        }
    } */
}
</style>
