<script setup lang="ts">
import GameCard from '@/components/GameCard.vue';
import Link from '@/components/Link.vue'
import { pickRandom, staticImage } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import { Config } from 'vike-vue/Config'


const pony = pickRandom(Object.values(gameData.data.categories.pony.objects))
const house = pickRandom(Object.values(gameData.data.categories.house.objects))
const shop = pickRandom(Object.values(gameData.data.categories.shop.objects))
const decor = pickRandom(Object.values(gameData.data.categories.decor.objects))
const avatar = pickRandom(Object.values(gameData.data.categories.avatar.objects))

</script>

<template>
    <Config :title="$t('site.title')" :description="$t('site.description')"></Config>

    <div>
        <section class="section">
            <h1 >{{ $t('site.title') }}</h1>
            <p>
                Welcome to All The Ponies, where you can see All The Ponies from the
                <Link class="link" href="https://www.gameloft.com/game/my-little-pony">My Little Pony Gameloft</Link> mobile game, as well as many
                other stuff. If you're a player of the game, this is the perfect website to
                gather information, track what you have, and more. If you're not a player, then
                it's still a great website. Since the game has over 2,000 ponies comprised of most
                friendship is Magic characters as well as some G1 and G3 ponies, it can be fun to
                scroll through them. You may also enjoy the <Link href="/quiz/" class="link">Pony Quiz</Link> to see
                how many ponies you can name.
            </p>
        </section>

        <section class="section">
            <h2>{{ $t('home.things_to_do.title') }}</h2>
            <h3>{{ $t('home.things_to_do.browse') }}</h3>
            <div class="things-container">
                <GameCard
                    :title="$t('game_object.pony.pony', 2)"
                    :image="staticImage(pony.image.main)"
                    :alt="gameData.translateName(pony).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.house.house', 2)"
                    :image="staticImage(house.image.main)"
                    :alt="gameData.translateName(house).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.shop.shop', 2)"
                    :image="staticImage(shop.image.main)"
                    :alt="gameData.translateName(shop).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.decor.decor', 2)"
                    :image="staticImage(decor.image.main)"
                    :alt="gameData.translateName(decor).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
                <GameCard
                    :title="$t('game_object.profile_decorations.avatar.avatar', 2)"
                    :image="staticImage(avatar.image.preview)"
                    :alt="gameData.translateName(avatar).value"
                    href="/search/ponies/"
                    class="thing-card"
                >
                </GameCard>
            </div>
        </section>
    </div>
</template>

<style lang="css" scoped>
.things-container {
    --card-size: 8rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, var(--card-size));
    gap: 0.3rem;
    justify-items: center;
    justify-content: center;
}

.thing-card {
}
</style>
