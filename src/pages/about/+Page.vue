<script setup lang="ts">
import { Config } from 'vike-vue/Config'
import Link from '@/components/Link.vue'

</script>

<template>
    <Config :title="$t('about.title')"></Config>
    <div>
        <section>
            <h1>{{ $t('about.title') }}</h1>
            <p>
                All The Ponies was initially created by <Link href="https://github.com/ego-lay-atman-bay/" class="link">ego-lay-atman-bay</Link>
                as a website to <Link href="/quiz/" class="link">name as many ponies you can</Link>,
                because one quiz I found online barely scratched the surface with names. I later expanded it to allow you
                to explore <Link href="/search/ponies/" class="link">all the ponies in the game</Link> as
                well as <Link href="/search/shops/" class="link">shops</Link>,
                <Link href="/search/houses/" class="link">houses</Link>,
                <Link href="/search/decor/" class="link">decor</Link>,
                and profile decorations. This website is now a resource for finding accurate information about stuff
                in the game, tracking what you have in the game, and of course small activities you can play that
                revolve around pony names (because there's so many).
            </p>
        </section>
        
        <section>
            <h2>Community</h2>
            <p>
                <!-- https://discord.gg/mlpgame -->
                Join the <Link href="https://discord.gg/Hbf9U8WfZk" class="link">MLP Game Hangout Discord server</Link> for an active
                community centered around the game. The server has many things like game event announcements,
                sales guides, early previews of things before they're available, and a great community.
                <!-- <a href="https://discord.gg/Hbf9U8WfZk" class="discord-link">Discord button</a> -->
            </p>
        </section>
        
        <section>
            <h2>Credits</h2>
            <ul class="list">
                <li>The website is build by <Link href="https://github.com/ego-lay-atman-bay" class="link">ego-lay-atman-bay</Link>.</li>
                <li>Thanks to <span class="text-green">Bass</span> for help with loading ponies with a friend code.</li>
                <li>The font used is <Link href="https://www.mattyhex.net/CMR/" class="link">Celestia Medium Redux</Link>, which is also used in the game.</li>
                <li>The website was built using <Link href="https://vuejs.org/" class="link">Vue.js</Link> to make my life easier and allow for a more dynamic experience.</li>
            </ul>
        </section>
        
        <section>
            <h2>Source code</h2>
            <p>
                The source code for All The Ponies can be found on
                <Link href="https://github.com/all-the-ponies/all-the-ponies.github.io/" class="link">GitHub</Link>.
                You can report issues there, but you can also help contribute if you want.
            </p>
        </section>
        
        <section>
            <h2>Translation</h2>
            <p>
                I am currently looking for help translating the website (anything that isn't found in the game),
                so if you know a second language, you can help translate the website through
                <Link href="https://github.com/all-the-ponies/all-the-ponies.github.io/" class="link">GitHub</Link>.
            </p>
        </section>
        
        <section>
            <h2>Contact</h2>
            <p>
                If you need to contact me at all, for questions, suggestions, or issues, feel free to use
                any platform below.
            </p>
            
            <ul class="list">
                <li><Link href="https://github.com/ego-lay-atman-bay/" class="link">GitHub</Link></li>
                <li><Link href="https://discord.gg/HAaDGpVBaA" class="link">Discord</Link></li>
                <li><Link href="https://www.reddit.com/user/ego-lay_atman-bay/" class="link">Reddit</Link></li>
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
