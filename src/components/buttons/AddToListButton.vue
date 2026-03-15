<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import DialogComponent from '../DialogComponent.vue';
import AddToListDialog from '../dialogs/AddToListDialog.vue';
import type { GameObjectId } from '@/types/gameDataTypes';
import CreateListDialog from '../lists/createList/CreateListDialog.vue';

const props = defineProps<{
    gameObject: GameObjectId,
}>()

const addToListDialog = useTemplateRef('add-to-list-dialog')

function addToList() {
    addToListDialog.value.open()
}

</script>

<template>
    <button @click.stop.prevent="addToList" class="button-circle button-green bookmark-button">
        <img class="icon" src="@/assets/images/ui/icons/bookmark.svg" :alt="$t('lists.button.add_to_list')" :aria-label="$t('lists.button.add_to_list')" :title="$t('lists.button.add_to_list')">
    </button>

    <AddToListDialog
        ref="add-to-list-dialog"
        :game-object="props.gameObject"
    >
    </AddToListDialog>

</template>

<style lang="css" scoped>
.bookmark-button {
    padding: 0.2em;
}

.icon {
    object-fit: contain;
    object-position: center;
    pointer-events: none;
    width: 100%;
    height: 100%;
}
</style>
