<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onErrorCaptured, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DialogComponent from '../DialogComponent.vue';
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
        <DialogComponent ref="model-dialog" :title="props.name" has-close-button @close="close">
            <ModelViewer v-if="visible && model" :model="model" :identity="props.identity" @close="dialog?.close()" />
            <p v-else-if="visible" role="status" aria-busy="true">{{ t('model_viewer.loading') }}</p>
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
</style>
