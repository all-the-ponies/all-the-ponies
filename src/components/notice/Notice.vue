<script setup lang="ts">
import { computed, ref } from 'vue';
import XButton from '../buttons/XButton.vue';
import { ClientOnly } from 'vike-vue/ClientOnly';
import { useGlobalStateStore } from '@/stores/globalState';

const globalState = useGlobalStateStore()

const props = defineProps<{
    noticeId: string,
}>()

const closed = computed(() => globalState.dismissedNotices.includes(props.noticeId))

function close() {
    console.log('Closing')
    globalState.dismissedNotices.push(props.noticeId)
}

</script>

<template>
    <client-only>
        <div v-if="!closed" class="notice-container">
            <x-button class="x-button" @click="close"></x-button>
            <div class="body">
                <slot></slot>
            </div>
        </div>
    </client-only>
</template>

<style lang="css" scoped>

.notice-container {
    position: relative;
    /* width: 100%; */
    margin: 0.5rem;
    margin-inline: auto;
    background-color: white;
    padding: 1rem;
    --box-shadow: inset 0px 0px 6px var(--pink);
    box-shadow: var(--box-shadow);
    border-radius: 0.8rem;
}

.x-button {
    font-size: 1.6rem;
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(30%, -30%);
}

.body {
    font-size: 1rem;
}
</style>
