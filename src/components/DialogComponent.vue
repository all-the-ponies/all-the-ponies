<script setup lang="ts">
import { ClientOnly } from 'vike-vue/ClientOnly'
import { nextTick, onMounted, ref, useTemplateRef } from 'vue'
import XButton from './buttons/XButton.vue'
import { resolve } from 'path';

const emit = defineEmits({
    open: null,
    close: null,
    cancel: null,
    submit: null,
})

const props = defineProps<{
    title: string,
    hasCloseButton?: boolean,
    open?: boolean,
}>()

const dialogElement = useTemplateRef('dialog-element')

const dialogOpen = ref<boolean>(false)

let _resolveSubmit: (value: boolean) => void
function resolvePromise(value: boolean) {
    if (_resolveSubmit) {
        _resolveSubmit(value)
        _resolveSubmit = undefined
    }
}

function open() {
    if (!dialogOpen.value) {
        emit('open')
        dialogOpen.value = true
        nextTick(() => {
            dialogElement.value.showModal()
        })
    }

    return new Promise((resolve) => {
        _resolveSubmit = resolve
    })
}

function close() {
    if (dialogOpen.value) {
        emit('close')
        dialogElement.value.close()
        dialogOpen.value = false
        resolvePromise(false)
    }
}

function submit() {
    if (dialogOpen.value) {
        emit('submit')
        resolvePromise(true)
        close()
    }
}

function cancel() {
    if (dialogOpen.value) {
        emit('cancel')
        resolvePromise(false)
        close()
    }
}

defineExpose({
    open,
    close,
    submit,
    cancel,
})

if (props.open) {
    open()
}

</script>

<template>
    <template v-if="dialogOpen">
        <ClientOnly>
            <Teleport to="body">
                <dialog class="dialog" ref="dialog-element" @close="cancel()">
                    <header class="dialog-header">
                        {{ props.title }}
                    </header>
                    <XButton
                        v-if="props.hasCloseButton"
                        class="dialog-close"
                        @click="cancel"
                    ></XButton>
                    <!-- <button
                    >X</button> -->
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
</template>

<style lang="css" scoped>

.dialog {
    margin: auto auto;
    border: none !important;
    border-radius: calc(5px * var(--ratio));
    box-shadow: 0 0 #0000, 0 0 #0000, 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    padding: 1.6rem;
    overflow: visible;

    border-radius: 10px;
    box-shadow: inset 0px -1px 4px hsl(211, 30%, 55%);

    flex-direction: column;

    min-width: min(15rem, 95dvw);
    max-width: 95dvw;
    min-height: 10rem;
    max-height: 90dvh;
    /* height: auto; */
}

.dialog:open {
    display: flex;
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
    width: 1.2em;
    height: 1.2em;
}

.dialog-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.dialog-content {
    color: var(--blue);
    margin: 0.5rem 0.2rem;
    
    flex: 1 1 auto;
    overflow-y: auto;
}

.dialog-menu {
    flex: 0 0 auto;
    display: grid;
    grid-auto-columns: minmax(6rem, auto);
    grid-auto-flow: column;
    justify-content: center;
    gap: 0.5em;
}
</style>
