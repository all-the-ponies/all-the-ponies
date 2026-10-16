<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DialogComponent from '../DialogComponent.vue';
import { resolveModel, type ModelRef } from './assets';

const props = defineProps<{identity: string, name: string}>()
const { t } = useI18n()
const ModelViewer = defineAsyncComponent(() => import('./ModelViewer.vue'))
const model = shallowRef<ModelRef | null>(null)
const visible = ref(false)
const error = ref('')
const dialog = useTemplateRef('model-dialog')
let abort: AbortController | undefined
let stopWatch: (() => void) | undefined

onMounted(() => {
    stopWatch = watch(() => props.identity, async identity => {
        dialog.value?.close()
        abort?.abort()
        const request = new AbortController()
        abort = request
        model.value = null
        error.value = ''
        try {
            const resolved = await resolveModel(identity, request.signal)
            if (!request.signal.aborted) model.value = resolved
        } catch (reason) {
            if (!request.signal.aborted) error.value = reason instanceof Error ? reason.message : String(reason)
        }
    }, {immediate: true})
})
onBeforeUnmount(() => {
    stopWatch?.()
    abort?.abort()
})
function open() {
    visible.value = true
    void dialog.value!.open()
}
</script>

<template>
    <div v-if="model || error" class="model-launcher-wrapper">
        <button
            class="button-circle button-blue model-launcher"
            :aria-label="t('model_viewer.open')"
            :title="error || t('model_viewer.open')"
            :disabled="!model"
            @click="open"
        >3D</button>
        <DialogComponent ref="model-dialog" :title="props.name" has-close-button @close="visible = false">
            <ModelViewer v-if="visible && model" :model="model" />
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
