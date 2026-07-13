<script setup lang="ts">
import { getCollection, getObject, translateName } from '@/scripts/gameData';
import { useSaveStore } from '@/stores/saveManager';
import type { CollectionType } from '@/types/gameDataTypes';
import { computed } from 'vue';
import Link from '../Link.vue';
import LazyImage from '../LazyImage.vue';
import { createAssetUrl } from '@/scripts/assets.ts';

const saveStore = useSaveStore()

const props = defineProps<{
    collection: string | CollectionType,
    href?: string,
    hover?: boolean,
}>()

const collection = computed(() => getCollection(props.collection))
const title = translateName(collection)

const ponies = computed(() => {
    if (!collection.value) {
        return []
    }
    return collection.value.ponies.map(
        item => getObject(item.item, 'pony')
    )
})

</script>

<template>
    <div class="collection-card" :class="{hoverable: (!!$props.href || props.hover)}">
        <component :is="props.href ? Link : 'span'" class="card-inner" :href="props.href">
            <span class="collection-name">
                {{ title }}
            </span>
            <div class="card-body">
                <div class="ponies">
                    <LazyImage
                        v-for="(pony, i) in ponies"
                        :src="createAssetUrl(pony.image.portrait.path)"
                        :style="{zIndex: ponies.length - i}"
                        class="pony"
                        :class="{'not-owned': !saveStore.hasPony(pony.id)}"
                    ></LazyImage>
                </div>
                <div class="info">
                    <div class="progress">

                    </div>
                    <div class="reward">

                    </div>
                </div>
            </div>
        </component>
    </div>
</template>

<style lang="css" scoped>
.collection-card {
    left: 0px;
    background-color: white;

    max-width: 100%;
    aspect-ratio: 16 / 9;

    border-radius: 0.8rem;
    --box-shadow: inset 0px -1px 4px hsl(211, 30%, 80%);
    box-shadow: var(--box-shadow);

    container-type: inline-size;
    text-decoration: none;

    transition: box-shadow 150ms ease-out,
                transform 150ms ease-out;
    
    position: relative;
}

.collection-card.hoverable {
    cursor: pointer;
}

.collection-card.hoverable:hover,
.collection-card.hoverable:focus {
    box-shadow: var(--box-shadow),
                0px 0px 5px hsl(211, 30%, 30%);
    transform: scale(105%);
}

.card-inner {
    border-radius: inherit;
    text-decoration: none;
}

.collection-name {
    font-size: 8cqw;
    word-break: break-word;
    text-shadow: var(--text-shadow);

    color: white;
    text-align: center;
    display: grid;
    align-items: center;
    width: 100%;
    height: 20%;
    background-image: linear-gradient(var(--pink-light), var(--pink));
    /* box-shadow: 0px 1px 0px 1px var(--pink-dark); */
    border-bottom: 2px solid var(--pink-dark);
    
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
}

.card-body {
    padding: 0.4rem;
    width: 100%;
    height: 80%;
    position: relative;
    display: grid;
    grid-template-rows: 100%;
}

.ponies {
    width: 100%;
    max-width: 100%;
    display: grid;
    grid-template-columns: repeat(v-bind('ponies.length'), 1fr);
}

.pony {
    max-width: 4rem;
    height: 4rem;
    object-fit: contain;
    object-position: left;
    margin-right: -4rem;

    --drop-shadow: drop-shadow(0 0 0.1px hsl(0, 0%, 50%));
    filter: var(--drop-shadow);
}

.pony:last-child {
    margin-right: 0;
}

.not-owned {
    /*
    Source - https://stackoverflow.com/a/78478074
    Posted by Keavon, modified by community. See post 'Timeline' for change history
    Retrieved 2026-07-12, License - CC BY-SA 4.0
    */

    --factor: 0.7; /* Should range only between 0 and 1 */
    filter: invert(calc(var(--factor) / 1.7)) brightness(calc(1 + var(--factor)))
            var(--drop-shadow);
}

.info {
    width: 100%;
    /* height: 30%; */
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    /* padding: 0.5rem; */
}

.card-body {
    /* height: 70%; */
    grid-template-rows: 75% 25%;
}

</style>
