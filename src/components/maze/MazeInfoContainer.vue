<script setup lang="ts">
import XButton from '../buttons/XButton.vue';

const emit = defineEmits(['close'])

</script>

<template>
    <div class="maze-info-container">
        <header class="info-header"><slot name="title"></slot></header>
        <XButton @click="emit('close')" class="x-button"></XButton>
        <slot class="content"></slot>
    </div>
</template>

<style lang="css" scoped>

.maze-info-container {
    padding-top: 1.4rem;
    margin-top: 1.5rem;
    margin-inline: 0.5rem;
    position: relative;
}

.info-header {
    text-align: center;
    translate: 0 -100%;
    padding: 0.2em 1em;
    color: white;
    text-shadow: var(--text-shadow);
    font-size: 1.7rem;

    perspective-origin: 50% 50%;
    perspective: 300px;
    transform-style: preserve-3d;

    position: absolute;
    margin-inline: auto;
    right: 0;
    left: 0;
    width: fit-content;
}

.info-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    
    transform: rotateX(-30deg) translateZ(-5px) translateY(5px);
    
    background-image: linear-gradient(var(--pink-light), var(--pink));
    box-shadow: 0px 1px 0px 1px var(--pink-dark);
    border-radius: 0.2em;
}

.x-button {
    position: absolute;
    top: 0;
    right: 0;
    translate: 50% -50%;

    font-size: 1.5rem;
    width: 1.2em;
    height: 1.2em;
}

</style>
