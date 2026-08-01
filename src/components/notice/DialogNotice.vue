<script setup lang="ts">
import { useGlobalStateStore } from '@/stores/globalState';
import { ClientOnly } from 'vike-vue/ClientOnly';
import { computed, onMounted, useTemplateRef } from 'vue';
import XButton from '../buttons/XButton.vue';
import DialogComponent from '../DialogComponent.vue';

const globalState = useGlobalStateStore()
const noticeDialog = useTemplateRef('notice-dialog')

const props = defineProps<{
    noticeId: string,
    startDate?: string,
    title: string,
}>()

const started = props.startDate ? new Date().getTime() >= new Date(props.startDate).getTime() : true
const show = computed(() => started && !globalState.dismissedNotices.includes(props.noticeId))


function close() {
    // console.log('Closing')
    globalState.dismissedNotices.push(props.noticeId)
}

onMounted(() => {
    if (show.value) {
        noticeDialog.value.open()
    }
})

</script>

<template>
    <DialogComponent
        ref="notice-dialog"
        :title="props.title"
        @close="close()"
        has-close-button
    >
        <div class="body">
            <slot></slot>
        </div>

        <template #menu>
            <button class="button button-blue" @click="noticeDialog.close()">{{ $t('button.ok') }}</button>
        </template>
    </DialogComponent>
</template>

<style lang="css" scoped>

.body {
    max-width: 40rem;
    text-align: center;
}

</style>
