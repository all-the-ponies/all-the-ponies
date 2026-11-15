<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onErrorCaptured, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaQuery } from '@vueuse/core';
import DialogComponent from '../DialogComponent.vue';
import InfoButton from '../buttons/infoButton.vue';
import XButton from '../buttons/XButton.vue';
import Loading from '../Loading.vue';
import { resolveModel, type ModelRef } from './assets';

const props = defineProps<{identity: string, name: string}>()
const { t } = useI18n()
const touchControls = useMediaQuery('(pointer: coarse)')
const controlActions = ['rotate', 'pan', 'zoom'] as const
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
            <template #title-action>
                <InfoButton class="controls-help" placement="bottom" center-on-screen :label="t('model_viewer.controls.title')">
                    <template #icon><img class="controls-help-icon" src="@/assets/images/ui/icons/info-icon.png" alt=""></template>
                    <div class="controls-guide" dir="auto" role="group" :aria-label="t('model_viewer.controls.title')" tabindex="0">
                        <strong>{{ t('model_viewer.controls.title') }}</strong>
                        <dl>
                            <template v-for="action in controlActions" :key="action">
                                <dt>{{ t(`model_viewer.controls.${action}`) }}</dt>
                                <dd>{{ t(`model_viewer.controls.${touchControls ? 'touch' : 'mouse'}.${action}`) }}</dd>
                            </template>
                        </dl>
                    </div>
                </InfoButton>
            </template>
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
    padding: .1rem .65rem .65rem;
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
    position: relative;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: .35rem;
    min-height: 1.9rem;
    overflow-wrap: anywhere;
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
.controls-help { flex: none; }
.controls-help :deep(.info-button) {
    display: grid;
    place-items: center;
    font-size: 1.5rem;
    margin: 0;
    padding: 0;
}
.controls-help-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    translate: 0 1px;
}
.controls-help :deep(.info-popover:popover-open) {
    display: flex;
    flex-direction: column;
    width: min(19rem, calc(100vw - 2rem));
    max-width: none;
    max-height: var(--popover-available-height);
}
.controls-guide { overflow-y: auto; }
.controls-guide dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: .35rem .6rem;
    margin: .4rem 0 0;
    text-align: start;
}
.controls-guide dt { font-weight: bold; }
.controls-guide dd { margin: 0; }
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
        padding: .1rem .4rem .4rem;
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
    :global(.dialog:has(.model-viewer-frame) .dialog-header) {
        font-size: 1.1rem;
    }
}
</style>
