<script setup lang="ts">
import AddToListButton from '@/components/buttons/AddToListButton.vue';
import { createAssetUrl } from '@/scripts/assets';
import { getObject, translateName } from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computedAsync } from '@vueuse/core';
import { computed } from 'vue';


const props = defineProps<{
    gameObject: GameObjectId | GameObject,
}>()

const gameObject = computedAsync(async () => await getObject(props.gameObject), null)
const name = computed(() => translateName(gameObject.value).value)
const image = computed(() => gameObject.value?.image?.main.path)


</script>

<template>
    <section class="section object-page">
        <div class="main-object-section">
            <div class="object-profile">
                <h1 class="name"><slot name="name">{{ name }}</slot></h1>
                <div class="image">
                    <div class="left-image-container">
                        <slot name="image-left"></slot>
                    </div>
                    <slot name="image">
                        <img class="object-image" :src="createAssetUrl(image)" :alt="name">
                    </slot>
                    <div class="right-image-container">
                        <slot name="image-right"></slot>
                        <AddToListButton v-if="gameObject" :gameObject="gameObject?.id"></AddToListButton>
                    </div>
                </div>
                <slot name="left-info"></slot>
            </div>
            <div class="object-info">
                <slot name="info"></slot>
            </div>
        </div>
    </section>
</template>

<style lang="css" scoped>
.object-page {
    container-type: inline-size;
}

.main-object-section {
    display: grid;
    grid-template-columns: 50% 50%;
}

@container (max-width: 35rem) {
    .main-object-section {
        grid-template-columns: auto;
    }
}

.object-profile {
    text-align: center;
    display: grid;
    justify-items: center;
}

.name {
    /* display: flex; */
    align-items: center;
    gap: 0.2em;
    overflow-wrap: anywhere;
}

.object-image {
    max-height: 15rem;
    max-width: 100%;
    object-fit: contain;
    object-position: center;
}

.image {
    position: relative;
    max-width: calc(100% - 4rem);
    display: flex;
    /* justify-items: center; */
}


.left-image-container,
.right-image-container {
    --width: 2rem;
    
    height: 100%;
    width: var(--width);
    /* position: absolute; */
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-content: center;
    align-items: center;
    gap: 0.3rem;

    /* padding: 0.4rem 0.3rem; */
}
.left-image-container {
    left: 0;
}
.right-image-container {
    right: 0;
}

.left-image-container > *,
.right-image-container > * {
    width: var(--width);
    height: var(--width);

    margin: 0;

    font-size: 1.5em;
}

</style>
