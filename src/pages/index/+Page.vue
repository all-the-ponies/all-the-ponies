<script setup lang="ts">
import Link from '@/components/Link.vue'
import { Config } from 'vike-vue/Config'
import Head from '../+Head.vue'
import { h } from 'vue'

const BASE_URL = __BASE_URL__ // __BASE_URL__ cannot be used in the template
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

  <div>
    <h1>All The Ponies</h1>
      
      Welcome to All The Ponies, where you can see All The Ponies from the
      <Link class="link" href="https://www.gameloft.com/game/my-little-pony">My Little Pony Gameloft</Link> mobile game, as well as many
      other stuff. If you're a player of the game, this is the perfect website to
      gather information, track what you have, and more. If you're not a player, then
      it's still a great website. Since the game has over 2,000 ponies comprised of most
      friendship is Magic characters as well as some G1 and G3 ponies, it can be fun to
      scroll through them. You may also enjoy the <Link href="/quiz/" class="link">Pony Quiz</Link> to see
      how many ponies you can name.
  </div>
</template>
