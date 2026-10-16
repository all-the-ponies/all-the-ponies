<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ModelRef } from './assets';
import type { mountViewer, ViewerState } from './runtime';

const props = defineProps<{model: ModelRef}>()
const { t } = useI18n()
const host = useTemplateRef('model-host')
const state = reactive<ViewerState>({ready: false, loading: true, playing: false, free: false, activeAnimation: '', error: ''})
let controller: ReturnType<typeof mountViewer> | undefined
let disposed = false

onMounted(async () => {
    try {
        const { mountViewer } = await import('./runtime')
        if (disposed) return
        controller = mountViewer(host.value!, props.model, value => Object.assign(state, value))
        host.value!.querySelector('canvas')?.setAttribute('aria-label', t('model_viewer.canvas'))
    } catch (error) {
        if (disposed) return
        state.loading = false
        state.error = error instanceof Error ? error.message : String(error)
    }
})
onBeforeUnmount(() => {
    disposed = true
    controller?.dispose()
})
</script>

<template>
    <div class="model-viewer" :aria-busy="state.loading">
        <div class="model-host" ref="model-host">
            <button
                class="rotation button button-blue"
                :disabled="!state.ready"
                :aria-pressed="state.free"
                :aria-label="t(state.free ? 'model_viewer.lock_rotation' : 'model_viewer.unlock_rotation')"
                :title="t(state.free ? 'model_viewer.lock_rotation' : 'model_viewer.unlock_rotation')"
                @click="controller?.setFree(!state.free)"
            >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path v-if="!state.free" d="M7 10V7a5 5 0 0 1 10 0v3" />
                    <path v-else d="M7 10V7a5 5 0 0 1 9-3" />
                    <rect x="4" y="10" width="16" height="12" rx="2" />
                    <path d="M12 15v3" />
                </svg>
            </button>
        </div>
        <div class="model-actions">
            <button class="button button-blue" :disabled="!state.ready" @click="controller?.reset()">
                {{ t('model_viewer.reset') }}
            </button>
            <div class="model-animations" :aria-label="t('model_viewer.animations')">
                <button
                    v-for="animation in props.model.animations"
                    :key="animation.id"
                    :disabled="!state.ready"
                    :class="{preferred: props.model.preferredAnimations?.includes(animation.id)}"
                    :aria-pressed="state.activeAnimation === animation.id"
                    @click="controller?.play(animation)"
                >{{ animation.name }}</button>
            </div>
        </div>
        <p v-if="state.error" class="model-status" role="alert">{{ t('model_viewer.failed') }} {{ state.error }}</p>
    </div>
</template>

<style scoped>
.model-viewer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(8rem, 11rem);
    gap: .5rem;
    width: min(44rem, calc(95dvw - 1.3rem));
}
.model-host {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    min-height: 0;
    background: linear-gradient(#eef4fa, #f5edf5);
    border-radius: .3rem;
}
.model-host :deep(canvas) {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
}
.rotation {
    position: absolute;
    z-index: 1;
    right: .45rem;
    top: .45rem;
    width: 2.1rem;
    height: 2.1rem;
    display: grid;
    place-items: center;
    padding: .4rem;
}
.rotation svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.model-actions {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    min-height: 0;
    /* The square model sets the row height; long menus scroll inside it. */
    contain: size;
}
.model-actions > .button {
    flex-shrink: 0;
    font-size: 1rem;
    margin: 0;
}
.model-animations {
    overflow-y: auto;
    background: var(--pink);
    border-radius: .3rem;
}
.model-animations button {
    display: block;
    width: 100%;
    padding: .2rem .5rem;
    border: 0;
    background: transparent;
    color: white;
    font: inherit;
    text-align: start;
    text-shadow: var(--text-shadow);
    overflow-wrap: anywhere;
    cursor: pointer;
}
.model-animations button.preferred {
    font-weight: 700;
    box-shadow: inset .2rem 0 rgba(255, 255, 255, .65);
}
.model-animations button:hover,
.model-animations button:focus-visible,
.model-animations button[aria-pressed="true"] {
    background: rgba(0, 0, 0, .2);
}
.model-status {
    grid-column: 1 / -1;
    margin: .2rem 0;
    overflow-wrap: anywhere;
}
/* Keep the existing ATP dialog's floating title/close button above the canvas. */
:global(.dialog:has(.model-viewer)) {
    padding: .65rem;
    min-height: 0;
}
:global(.dialog:has(.model-viewer) .dialog-content) {
    margin: 0;
}
:global(.dialog:has(.model-viewer) .dialog-menu:empty) {
    display: none;
}
:global(.dialog:has(.model-viewer) .dialog-header) {
    top: 0;
    max-width: calc(100% - 5rem);
    z-index: 1;
}
:global(.dialog:has(.model-viewer) .dialog-close) {
    margin: 0;
    translate: 0 -100%;
    z-index: 2;
}
:global(.dialog:has(.model-viewer):focus),
:global(.dialog:has(.model-viewer) button:focus) {
    outline: none;
}
@media (max-width: 480px) {
    :global(.dialog:has(.model-viewer)) {
        padding: .4rem;
    }
    .rotation {
        width: 1.65rem;
        height: 1.65rem;
        padding: .3rem;
        right: .25rem;
        top: .25rem;
    }
    :global(.dialog:has(.model-viewer) .dialog-header) {
        font-size: 1.1rem;
    }
    .model-viewer {
        width: calc(95dvw - .8rem);
        grid-template-columns: minmax(0, 1fr) minmax(6rem, .6fr);
        gap: .35rem;
    }
    .model-actions {
        font-size: .85rem;
    }
    .model-actions > .button {
        font-size: .85rem;
    }
}
</style>
