<script setup lang="ts">
import { useTemplateRef } from 'vue';
import DialogComponent from './DialogComponent.vue';

const dialog = useTemplateRef('dialog')

// const props = defineProps({
//     category: 
// })

</script>

<template>
    <dialog-component
        ref="dialog"
        :title="$t('dialog.SORT_BY')"
    >



    <template name:menu>
        <button @click="dialog.submit()" class="button button-green">{{ $t('OK').toLocaleUpperCase() }}</button>
        <button @click="dialog.cancel()" class="button button-red">{{ $t('CANCEL') }}</button>
    </template>
    </dialog-component>
</template>
