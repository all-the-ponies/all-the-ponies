<script setup lang="ts">
import { useTemplateRef } from 'vue';
import ClientOnly from './ClientOnly.vue';

const emit = defineEmits({
    open: null,
    close: null,
    cancel: null,
    submit: null,
})

const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    hasCloseButton: {
        type: Boolean,
        default: false,
    },
})

const dialogElement = useTemplateRef('dialog-element')

function open() {
    emit('open')
    dialogElement.value.showModal()
}

function close() {
    emit('close')
    dialogElement.value.close()
}

function submit() {
    emit('submit')
    close()
}

function cancel() {
    emit('cancel')
    close()
}

defineExpose({
    open,
    close,
    submit,
    cancel,
})

</script>

<template>
    <ClientOnly>
        <Teleport to="body">
            <dialog class="dialog" ref="dialog-element">
                <header class="dialog-header">
                    {{ props.title }}
                </header>
                <button
                    v-if="props.hasCloseButton"
                    class="dialog-close button-pink button-circle"
                    @click="cancel"
                >X</button>
                <div class="dialog-body">
                    <section class="dialog-content">
                        <slot></slot>
                    </section>
                    <menu class="dialog-menu">
                        <slot name="menu"></slot>
                    </menu>
                </div>
            </dialog>
        </Teleport>
    </ClientOnly>
</template>

<style>

.dialog {
    margin: auto auto ;
    border: none !important;
    border-radius: calc(5px * var(--ratio));
    box-shadow: 0 0 #0000, 0 0 #0000, 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 1.6rem;
    overflow: visible;

    border-radius: 10px;
    box-shadow: inset 0px -1px 4px hsl(211, 30%, 55%);
    max-width: min(100dvw, 20rem);;
}

.dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
}

.dialog-header {
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

.dialog-header::before {
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

.dialog-close {
    position: absolute;
    top: 0;
    right: 0;
    translate: 50% -50%;

    font-size: 2rem;
    /* padding: 0.3em; */
    width: 1.2em;
    height: 1.2em;
}

.dialog-menu {
    display: grid;
    grid-auto-columns: minmax(6rem, auto);
    grid-auto-flow: column;
    justify-content: center;
    gap: 0.5em;
}

.dialog-content {
    color: var(--blue);
    margin: 0.5rem 0.2rem;
    /* width: min-content; */
    /* min-width: 20rem; */
}
</style>
