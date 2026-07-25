<script lang="ts" setup>
import { computed, type AnchorHTMLAttributes } from 'vue'
import LazyImage from "../LazyImage.vue"
import Link from "../Link.vue"
import ObjectImage from "../ObjectImage.vue"
import type { MazePonyType } from '@/types/gameDataTypes.ts';
import { getMazePony, getObject, translateName } from '@/scripts/gameData.ts';
import { createAssetUrl } from '@/scripts/assets.ts';

const props = defineProps<{
    mazePony: string | MazePonyType,
    href?: AnchorHTMLAttributes['href'],
    hover?: boolean,
}>()

const mazePony = computed(() => getMazePony(props.mazePony))
const pony = computed(() => getObject(mazePony.value.pony, 'pony'))
const name = translateName(pony)

const href = computed(() => props.href || (pony.value ? `/${pony.value.category}/${pony.value.id}/` : null))

</script>

<template>
    <div class="object-card" :class="{hoverable: (!!href || props.hover)}">
        <component :is="href ? Link : 'span'" class="card-inner" :href="href">
            <span class="object-name">
                {{ name }}
            </span>
            <div class="card-body">
                <LazyImage v-if="pony" :src="createAssetUrl(pony.image.main.path)" :alt="name" loading="lazy" class="object-image" />
                <div class="left-container">
                    <slot name="left"></slot>
                </div>
                <div class="right-container">
                    <slot name="right"></slot>
                </div>
                <div class="info">
                    <span>{{ mazePony.fights }}</span>
                    <img src="@/assets/images/ui/maze/maze-fights-icon.png" alt="Fights">
                    <span>{{ mazePony.power }}</span>
                    <img src="@/assets/images/ui/maze/maze-power-icon.png" alt="Fights">
                </div>
            </div>
        </component>
    </div>
</template>

<style lang="css" scoped>
.object-card {
    margin: 0.5rem;
    
    left: 0px;
    background-color: white;

    width: var(--card-size, 7rem);
    height: calc(var(--card-size, 7rem) * (4 / 3));
    aspect-ratio: 3 / 4;

    border-radius: 0.8rem;
    --box-shadow: inset 0px -1px 4px hsl(211, 30%, 80%);
    box-shadow: var(--box-shadow);

    container-type: inline-size;
    text-decoration: none;

    transition: box-shadow 150ms ease-out,
                transform 150ms ease-out;
    
    position: relative;
}

.object-card.hoverable {
    cursor: pointer;
}

.object-card.hoverable:hover,
.object-card.hoverable:focus {
    box-shadow: var(--box-shadow),
                0px 0px 5px hsl(211, 30%, 30%);
    transform: scale(105%);
}

.card-inner {
    border-radius: inherit;
    text-decoration: none;
}

.object-name {
    font-size: 10cqw;
    word-break: break-word;
    text-shadow: var(--text-shadow);

    color: white;
    text-align: center;
    display: grid;
    align-items: center;
    width: 100%;
    height: 20%;
    background-image: linear-gradient(#3b92be, #3586b2);
    /* box-shadow: 0px 1px 0px 1px var(--pink-dark); */
    
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

.card-body {
    display: grid;
    justify-content: center;
    padding: 0.4rem;
    width: 100%;
    height: 80%;
    position: relative;
    grid-template-rows: 75% 25%;
}

.object-image-container {
    width: 100%;
    height: 100%;
}

.object-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    padding: 0.3rem;
}

.left-container,
.right-container {
    height: 100%;
    width: 2rem;
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-content: center;
    gap: 0.3rem;

    padding: 0.4rem 0.3rem;
}
.left-container {
    left: 0;
}
.right-container {
    right: 0;
}

.left-container > *,
.right-container > * {
    width: 1.5rem;
    height: 1.5rem;

    margin: 0;
}

.info {
    width: 100%;
    /* height: 30%; */
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 0.8rem;
    gap: 0.4rem;
    font-size: 16cqw;
    color: black;
}

.info img {
    height: 1em;
    object-fit: contain;
    object-position: center;
}

</style>
