<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue';
import SelectObjectDialog from '@/components/dialogs/SelectObjectDialog.vue';
import GameCard from '@/components/GameCard.vue';
import { staticImage } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import { useListStore } from '@/stores/listStore';
import type { GameObjectId } from '@/types/gameDataTypes';
import { computed, ref, useTemplateRef } from 'vue';

const listsStore = useListStore()

const createListDialog = useTemplateRef('create-list')
const selectItemDialog = useTemplateRef('select-object-dialog')

const name = ref<string>()
const image = ref<{item: GameObjectId | null, image: string | null}>()
const gameObject = computed(() => gameData.getObject(image.value?.item))


function createList() {
    name.value = ''
    image.value = {
        item: 'Pony_Twilight_Sparkle',
        image: 'main',
    }
    createListDialog.value.open()
}

function submitList() {
    listsStore.createList(
        name.value,
        image.value,
        new Date(),
    )
}

function cancelList() {

}

function selectImage() {
    selectItemDialog.value.open()
}

function selectedImage(objectId: GameObjectId) {
    image.value.item = objectId
}

defineExpose({
    createList
})

</script>

<template>
    <DialogComponent
        ref="create-list"
        :title="$t('lists.dialog.create_list.title')"
        @submit="submitList"
        @cancel="cancelList"
    >

        {{ $t('lists.dialog.create_list.message.name') }}
        <input
            v-model="name"
            class="text-box"
            :placeholder="$t('lists.dialog.create_list.message.wishlist')"
            type="text"
            name="list-name"
        >

        <GameCard
            :title="name || $t('lists.dialog.create_list.message.wishlist')"
            hover
            :image="staticImage(gameObject ? gameObject.image[image.image] : null)"
            @click="selectImage()"
        ></GameCard>

        <template #menu>
            <button @click="createListDialog.submit()" class="button button-green">{{ $t('button.ok') }}</button>
            <button @click="createListDialog.cancel()" class="button button-red">{{ $t('button.cancel') }}</button>
        </template>
    </DialogComponent>

    <SelectObjectDialog
        ref="select-object-dialog"
        @submit="selectedImage"
    >

    </SelectObjectDialog>
</template>

<style lang="css" scoped>

</style>
