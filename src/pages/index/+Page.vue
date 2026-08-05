<script setup lang="ts">
import DiscordButton from '@/components/buttons/socials/DiscordButton.vue';
import GitHubButton from '@/components/buttons/socials/GitHubButton.vue';
import KofiButton from '@/components/buttons/socials/KofiButton.vue';
import RedditButton from '@/components/buttons/socials/RedditButton.vue';
import WeblateButton from '@/components/buttons/socials/WeblateButton.vue';
import WikiButton from '@/components/buttons/socials/WikiButton.vue';
import GameCard from '@/components/GameCard.vue';
import Link from '@/components/Link.vue';
import links from '@/globals/links';
import { createAssetUrl } from '@/scripts/assets.ts';
import { pickRandom } from '@/scripts/common';
import { useGameObjects, translateName, getMazeData } from '@/scripts/gameData';
import type { AvatarType, DecorType, HouseType, PonyType, ShopType } from '@/types/gameDataTypes';
import { timestamp, useTimestamp } from '@vueuse/core';
import { Config } from 'vike-vue/Config';
import { useData } from 'vike-vue/useData';
import { computed, h, onMounted, ref, watch } from 'vue';
import type { Data } from './+data';
import type { LTSEvent } from '@/scripts/api.types';
import { language } from '@/globals';
import { formatTime, formatTimestamp } from '@/scripts/timeFunctions';
import LazyImage from '@/components/LazyImage.vue';


const BASE_URL = __BASE_URL__ // __BASE_URL__ cannot be used in the template

const data = useData<Data>()
const eventInfo = computed(() => data.eventInfo)
const currentTime = useTimestamp()

const mazeData = getMazeData()
const gameObjects = useGameObjects()


const pony = ref<PonyType>(null)
const house = ref<HouseType>(null)
const shop = ref<ShopType>(null)
const decor = ref<DecorType>(null)
const avatar = ref<AvatarType>(null)

onMounted(() => {
    pony.value = pickRandom(Object.values(gameObjects.value.pony.objects))
    house.value = pickRandom(Object.values(gameObjects.value.house.objects))
    shop.value = pickRandom(Object.values(gameObjects.value.shop.objects))
    decor.value = pickRandom(Object.values(gameObjects.value.decor.objects))
    avatar.value = pickRandom(Object.values(gameObjects.value.avatar.objects))

    console.log('eventInfo', eventInfo.value)
})

const eventType = computed(() => eventInfo.value?.current ? 'current' : 'next')

const shownEvent = computed(() => {
    const id = eventInfo.value?.current?.id || eventInfo.value?.next?.id
    if (!id) {
        return
    }
    return id.toLowerCase()
})

const eventName = computed(() => {
    if (shownEvent.value == mazeData.id.toLowerCase()) {
        return mazeData.name[language.value.key]
    }
})
const eventImage = computed(() => {
    if (shownEvent.value == mazeData.id.toLowerCase()) {
        return mazeData.image.outro.path || mazeData.image.main.path
    }
})

const eventCountdown = computed(() => {
    const targetTimeString = eventInfo.value?.current?.end_date || eventInfo.value?.next?.start_date
    if (!targetTimeString) {
        return
    }
    const targetTime = new Date(targetTimeString)
    return (targetTime.getTime() - currentTime.value) / 1000
})

const eventUrl = computed(() => {
    if (shownEvent.value == mazeData.id.toLowerCase()) {
        return '/events/maze/'
    }
})

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
                    :image="pony ? createAssetUrl(pony.image.main.path) : null"
                    :alt="translateName(pony).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.house.house', 2)"
                    :image="house ? createAssetUrl(house.image.main.path) : null"
                    :alt="translateName(house).value"
                    href="/search/houses/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.shop.shop', 2)"
                    :image="shop ? createAssetUrl(shop.image.main.path) : null"
                    :alt="translateName(shop).value"
                    href="/search/shops/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.decor.decor', 2)"
                    :image="decor ? createAssetUrl(decor.image.main.path) : null"
                    :alt="translateName(decor).value"
                    href="/search/decor/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.profile_decorations.avatar.avatar', 2)"
                    :image="avatar ? createAssetUrl(avatar.image.preview.path) : null"
                    :alt="translateName(avatar).value"
                    href="/search/avatars/"
                    class="thing-card"
                >
                </GameCard>
            </div>
        </section>
        <section class="section" v-if="eventInfo && (eventInfo.current || eventInfo.next) && eventUrl">
            <div class="lts-event">
                <h2>
                    {{ $t(eventType == 'current' ? 'home.events.current_event' : 'home.events.next_event') }}
                </h2>
                <Link :href="eventUrl" class="link lts-event-link">
                    <span class="lts-event-name">{{ eventName }}</span>
                    <div>
                        <LazyImage :src="createAssetUrl(eventImage)" class="lts-event-image"></LazyImage>
                    </div>
                </Link>
                <div>
                {{ $t(
                    eventType == 'current' ? 'home.events.ends_in' : 'home.events.starts_in',
                    {
                        timestamp: formatTime(eventCountdown, {style: 'long'})
                    }
                   ) }}
                </div>
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

.lts-event {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.lts-event-name {
    font-size: 1.5rem;
}

.lts-event-image {
    max-width: 100%;
    width: 13rem;
    height: 13rem;
    object-fit: contain;
    object-position: center;
}

.lts-event-link {

}

.social-button {
    margin: 0.5rem;
}

</style>
