<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onErrorCaptured, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DialogComponent from '../DialogComponent.vue';
import XButton from '../buttons/XButton.vue';
import Loading from '../Loading.vue';
import { resolveModel, type ModelRef } from './assets';

const props = defineProps<{identity: string, name: string}>()
const { t } = useI18n()
const ModelViewer = defineAsyncComponent({
    loader: () => import('./ModelViewer.vue'),
    loadingComponent: Loading,
    delay: 0,
})
const model = shallowRef<ModelRef | null>(null)
const visible = ref(false)
const dialog = useTemplateRef('model-dialog')
const tools = useTemplateRef('model-tools')
let abort: AbortController | undefined

watch(() => props.identity, () => {
    dialog.value?.close()
    abort?.abort()
    model.value = null
})
onBeforeUnmount(() => abort?.abort())
onErrorCaptured(() => {
    dialog.value?.close()
    return false
})
function open() {
    visible.value = true
    void dialog.value!.open()
    if (!model.value) void loadModel()
}
function close() {
    visible.value = false
    abort?.abort()
}
async function loadModel() {
    abort?.abort()
    const request = new AbortController()
    abort = request
    try {
        const resolved = await resolveModel(props.identity, request.signal)
        if (request.signal.aborted) return
        if (!resolved) {
            dialog.value?.close()
            return
        }
        model.value = resolved
    } catch {
        if (!request.signal.aborted) dialog.value?.close()
    }
}
</script>

<template>
    <div class="model-launcher-wrapper">
        <button
            class="button-circle button-blue model-launcher"
            :aria-label="t('model_viewer.open')"
            :title="t('model_viewer.open')"
            @click="open"
        >3D</button>
        <DialogComponent ref="model-dialog" :title="props.name" @close="close">
            <div ref="model-tools" class="model-dialog-tools">
                <XButton class="dialog-close" @click="dialog?.cancel()" />
            </div>
            <div class="model-viewer-frame">
                <ModelViewer v-if="visible && model" :model="model" :identity="props.identity"
                    :controls-target="tools" @close="dialog?.close()" />
                <Loading v-else-if="visible" role="status" :aria-label="t('model_viewer.loading')" />
            </div>
        </DialogComponent>
    </div>
</template>

<style scoped>
.model-launcher {
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    font-size: 1rem;
    padding: 0;
    outline: none;
}
.model-viewer-frame {
    --model-height: min(36dvh, 19rem);
    --model-gap: .5rem;
    position: relative;
    width: min(40rem, calc(95dvw - 1.3rem));
    max-width: 100%;
    min-height: calc(var(--model-height) + var(--model-gap));
}
.model-viewer-frame :deep(.loading) {
    inset: 0;
    z-index: 1;
    background: transparent;
    opacity: 1;
    pointer-events: none;
}
/* Reserve the same dialog frame before the catalogue and viewer are loaded. */
:global(.dialog:has(.model-viewer-frame)) {
    position: fixed;
    top: 50dvh;
    left: 50dvw;
    right: auto;
    bottom: auto;
    margin: 0;
    translate: -50% -50%;
    padding: 2rem .65rem .65rem;
    min-height: 0;
    max-height: calc(100dvh - 1rem);
}
:global(.dialog:has(.model-viewer-frame) .dialog-content) {
    margin: 0;
}
:global(.dialog:has(.model-viewer-frame) .dialog-menu:empty) {
    display: none;
}
:global(.dialog:has(.model-viewer-frame) .dialog-header) {
    top: .25rem;
    translate: none;
    max-width: calc(100% - 5rem);
    padding: 0;
    color: var(--blue);
    text-shadow: none;
    font-size: 1.3rem;
    line-height: 1.2;
    z-index: 1;
}
:global(.dialog:has(.model-viewer-frame) .dialog-header::before) {
    display: none;
}
.model-dialog-tools {
    position: absolute;
    top: .1rem;
    right: .3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .5rem;
    z-index: 2;
}
.model-dialog-tools .dialog-close {
    /* XButton's native diameter is 1.2em. */
    font-size: calc(2rem / 1.2);
    width: 1.2em;
    height: 1.2em;
    margin: 0;
    translate: none;
}
.model-dialog-tools :deep(.preview-tools) {
    display: contents;
}
:global(.dialog:has(.model-viewer-frame):focus) {
    outline: none;
}
@media (max-width: 640px) {
    .model-viewer-frame {
        --model-gap: .35rem;
        width: calc(95dvw - .8rem);
        height: calc(100dvh - 4rem);
        min-height: 0;
    }
    :global(.dialog:has(.model-viewer-frame)) {
        padding: 2rem .4rem .4rem;
    }
    :global(.dialog:has(.model-viewer-frame) .dialog-header) {
        font-size: 1.1rem;
    }
    .model-dialog-tools {
        right: calc(.4rem + .25rem);
    }
}
@media (max-height: 500px) {
    .model-viewer-frame {
        --model-height: 40dvh;
    }
    :global(.dialog:has(.model-viewer-frame)) {
        padding-top: 2rem;
    }
    :global(.dialog:has(.model-viewer-frame) .dialog-header) {
        font-size: 1.1rem;
    }
}
</style>
