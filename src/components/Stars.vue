<script setup lang="ts">
import { computed, ref } from 'vue';


const props = defineProps<{
  modelValue: number,
  disabled?: boolean,
}>()

const hovered = ref<number>(-1)

const emit = defineEmits(['update:modelValue'])

const stars = computed({
  get() {
    return props.modelValue
  },
  set(value: number) {
    emit('update:modelValue', value)
  },
})

function setStars(value: number) {
  if (value === stars.value) {
    stars.value = 0
  } else {
    stars.value = value
  }
}

</script>

<template>
<div>
    <div class="stars-container">
        <div class="content">
            <slot></slot>
        </div>
         <div :aria-label="`${stars} Stars`"> 
            <button
                v-for="index in 5"
                class="star"
                :class="{
                  filled: index <= stars,
                  ghost: hovered > 0 && (hovered >= index) && (index > stars),
                  'ghost-filled': hovered > 0 && ((hovered <= index || hovered == stars) && (index <= stars)),
                }"
                @click="setStars(index)"
                @mouseover="hovered = index"
                @mouseleave="hovered = -1"
                :key="`star-${index}`"
                :disabled="props.disabled"
            ></button>
         </div> 
    </div>
</div>
</template>

<style scoped lang="scss">
.stars-container{
    container-type: size;
    position: relative;
    width: fit-content;
    width: 100%;
    height: 100%;
}

.content {
    width: 100%;
    height: 100%;
    padding: 2rem;
}

.stars-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    container-type: size;
    /* pointer-events: none; */
}

.star {
    --color-inactive: #8A2D48;
    --color-active: hsl(57, 100%, 61%);
    --color-hover: hsl(57, 100%, 61%);
    --background-color: #8A2D48;
    --star-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    --star-inside-path: polygon(50% 4%, 60% 36%, 94% 36%, 66% 57%, 77% 88%, 50% 68%, 23% 88%, 34% 57%, 5% 36%, 40% 36%);
    
    background: none;
    
    font-size: 1em;
    width: 1em;
    aspect-ratio: 1 / 1;
    
    position: relative;

    border: none;
    translate: -50% 0%;
    /* filter: drop-shadow(0px 0px 2px hsl(211, 30%, 30%)); */
    /* box-shadow: 0px 0px 10px hsl(211, 30%, 30%); */

}

.star:not(:disabled) {
    cursor: pointer;
}

.star:disabled {
    pointer-events: none;
}

.star::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--background-color);
    clip-path: var(--star-path);
}

.star::after {
    content: "";
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: hsl(57, 100%, 50%);
    opacity: 0;
    clip-path: var(--star-inside-path);
    
    /* scale: 90%;
    translate: 5% 2%; */
    
    transition: opacity 200ms;
}

.star.filled::after {
    opacity: 1;
}

@for $i from 1 through 5 {
    .star:nth-child(#{$i}) {
        position: absolute;
        left:  calc((sin(30deg * $i - 90deg) * 45cqw) + 50cqw);
        bottom:  calc((cos(30deg * $i + 90deg) * 45cqw) + 50cqw);
    }
}

.star.ghost::after,
.star.filled.ghost-filled::after {
    opacity: 0.6;
}

</style>
