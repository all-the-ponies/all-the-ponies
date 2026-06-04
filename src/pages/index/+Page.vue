<script setup lang="ts">
import GameCard from '@/components/GameCard.vue';
import Link from '@/components/Link.vue'
import { pickRandom, staticImage } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import type { AvatarType, DecorType, HouseType, PonyType, ShopType } from '@/types/gameDataTypes';
import { Config } from 'vike-vue/Config'
import Head from '../+Head.vue'
import { h } from 'vue'
import links from '@/globals/links';


const BASE_URL = __BASE_URL__ // __BASE_URL__ cannot be used in the template
import { onMounted, ref } from 'vue';
import DiscordButton from '@/components/buttons/socials/DiscordButton.vue';
import GitHubButton from '@/components/buttons/socials/GitHubButton.vue';
import KofiButton from '@/components/buttons/socials/KofiButton.vue';
import RedditButton from '@/components/buttons/socials/RedditButton.vue';
import WikiButton from '@/components/buttons/socials/WikiButton.vue';
import WeblateButton from '@/components/buttons/socials/WeblateButton.vue';


const pony = ref<PonyType>(null)
const house = ref<HouseType>(null)
const shop = ref<ShopType>(null)
const decor = ref<DecorType>(null)
const avatar = ref<AvatarType>(null)

onMounted(() => {
    pony.value = pickRandom(Object.values(gameData.data.categories.pony.objects))
    house.value = pickRandom(Object.values(gameData.data.categories.house.objects))
    shop.value = pickRandom(Object.values(gameData.data.categories.shop.objects))
    decor.value = pickRandom(Object.values(gameData.data.categories.decor.objects))
    avatar.value = pickRandom(Object.values(gameData.data.categories.avatar.objects))
})

function openSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle')
    sidebarToggle.checked = true
    if (sidebarToggle != null) {
    }
}

</script>

<template>
  <Config
    :title="$t('site.title')"
    :description="$t('site.description')"
    :-head="
      // https://developers.google.com/search/docs/appearance/site-names#website
      h('script', {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context' : 'https://schema.org',
          '@type' : 'WebSite',
          name : 'All The Ponies',
          alternateName: 'ATP',
          url : BASE_URL,
        }),
      })
    "
  ></Config>

    <div class="home-page">
        <section class="section">
            <h1 >{{ $t('site.title') }}</h1>
            <i18n-t keypath="home.description" tag="p">
                <template #game_link>
                    <Link class="link" href="https://www.gameloft.com/game/my-little-pony">
                        {{ $t('home.message.game_name') }}
                    </Link>
                </template>
            </i18n-t>
        </section>

        <section class="section">
            <h2>{{ $t('home.things_to_do.browse') }}</h2>
            <div class="things-container">
                <GameCard
                    :title="$t('game_object.pony.pony', 2)"
                    :image="pony ? staticImage(pony.image.main) : null"
                    :alt="gameData.translateName(pony).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.house.house', 2)"
                    :image="house ? staticImage(house.image.main) : null"
                    :alt="gameData.translateName(house).value"
                    href="/search/houses/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.shop.shop', 2)"
                    :image="shop ? staticImage(shop.image.main) : null"
                    :alt="gameData.translateName(shop).value"
                    href="/search/shops/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.decor.decor', 2)"
                    :image="decor ? staticImage(decor.image.main) : null"
                    :alt="gameData.translateName(decor).value"
                    href="/search/decor/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.profile_decorations.avatar.avatar', 2)"
                    :image="avatar ? staticImage(avatar.image.preview) : null"
                    :alt="gameData.translateName(avatar).value"
                    href="/search/avatars/"
                    class="thing-card"
                >
                </GameCard>
            </div>
        </section>
        <section class="section">
            <h2>{{ $t('home.message.links') }}</h2>
            <div>
                <DiscordButton :href="links.discordServer">{{ $t('socials.discord') }}</DiscordButton>
                <GitHubButton :href="links.githubRepo">{{ $t('socials.github') }}</GitHubButton>
                <KofiButton :href="links.kofi">{{ $t('socials.donate') }}</KofiButton>
                <WeblateButton :href="links.weblate">{{ $t('socials.help_translate') }}</WeblateButton>
            </div>
        </section>
        <section class="section">
            <h2>{{ $t('home.message.affiliates') }}</h2>
            <div>
                <DiscordButton :href="links.mlpGameHangoutServer">{{ $t('socials.mlp_game_hangout') }}</DiscordButton>
                <WikiButton :href="links.wiki">{{ $t('socials.wiki') }}</WikiButton>
                <RedditButton :href="links.reddit">r/MLPIOS</RedditButton>
            </div>
        </section>
    </div>
</template>

<style lang="css" scoped>
.home-page {
    text-align: center;
}

.things-container {
    --card-size: 8rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, var(--card-size));
    gap: 0.3rem;
    justify-items: center;
    justify-content: center;
}

.social-button {
    margin: 0.5rem;
}
</style>
