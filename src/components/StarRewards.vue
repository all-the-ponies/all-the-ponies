<script setup lang="ts">
import { computed } from 'vue';
import ObjectImage from './ObjectImage.vue'
import { type StarReward } from '@/types/gameDataTypes';

const props = defineProps<{
  modelValue?: number,
  rewards: StarReward[],
  stars?: number,
}>()

const emit = defineEmits(['update:modelValue', 'update:stars'])

const stars = computed({
  get() {
    return props.modelValue
  },
  set(value: number) {
    emit('update:modelValue', value)
  },
})

</script>

<template>
    <div class="star-rewards">
        <div class="star-rewards-bar">
            <button class="invisible-button" @click="stars = 0"></button>
            <div class="rewards-container">
                <button class="star-reward" :class="stars >= (index + 1) ? 'rewarded' : ''" v-for="(reward, index) in props.rewards" @click="stars = index + 1">
                    <object-image :object="reward.item" />
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="css" scoped>

.star-rewards-bar {
    --stars: v-bind('stars');
    --first-star: max(5%, 2rem);

    display: grid;
    grid-template-columns: var(--first-star) auto;
    justify-content: stretch;
    /* background-color: var(--pink); */
    position: relative;
}

.rewards-container {
    display: flex;
    justify-content: space-between;
    /* background-color: var(--pink); */
    position: relative;
}

.star-rewards-bar::before {
    content: "";
    background-color: #E8E8E8;
    border: 1px solid #B5B5B5;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 2%;
    margin-block: auto;
    width: 96%;
    height: 50%;
    z-index: -1;
}

.star-rewards-bar::after {
    content: "";
    background-color: var(--pink);
    border: 1px solid var(--pink);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 2%;
    margin-block: auto;
    width: max(0%, calc(var(--first-star) + ((var(--stars) - 1) * ((96% - var(--first-star)) / 4))));
    height: 50%;
    z-index: -1;

    transition: width ease-out 200ms;
}

.invisible-button {
    /*width: 2rem;
    height: 2rem;
    aspect-ratio: 1 / 1;*/
    cursor: pointer;
    opacity: 0;
}

.star-reward {
    display: inline;
    width: 2rem;
    height: 2rem;
    aspect-ratio: 1 / 1;

    padding: 0.3rem;
    background-color: #C0ECFF;
    /* background-image: radial-gradient(white, #A9BED2); */
    box-shadow: inset 2px 2px 2px white,
                0px 1px 2px hsl(0, 0%, 50%);
    border-radius: 50rem;
    border: none;
    cursor: pointer;

    transition: background-color linear 200ms;
}

.star-reward.rewarded {
    background-color: #FFCADB;
}

.star-reward * {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
}
</style>
