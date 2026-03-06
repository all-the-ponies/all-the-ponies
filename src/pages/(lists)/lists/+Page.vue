<script setup lang="ts">
import CreateListDialog from '@/components/lists/createList/CreateListDialog.vue';
import { useListStore } from '@/stores/listStore';
import { useTemplateRef } from 'vue';

const listsStore = useListStore()
const createListDialog = useTemplateRef('create-list-dialog')

console.log(listsStore.lists)

function createList() {
    createListDialog.value.createList()
}

</script>

<template>
    <section>
        <h1>{{ $t('lists.title') }}</h1>
        <button @click="createList" class="button button-blue">{{ $t('lists.create_list') }}</button>
    </section>

    <CreateListDialog ref="create-list-dialog"></CreateListDialog>
</template>
