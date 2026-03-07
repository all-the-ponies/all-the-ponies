<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue';
import SelectObjectDialog from '@/components/dialogs/SelectObjectDialog.vue';
import GameCard from '@/components/GameCard.vue';
import { pickRandom, staticImage } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import { useListStore } from '@/stores/listStore';
import type { CategoryName, GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import ChooseImageDialog from './ChooseImageDialog.vue';
import { CATEGORIES } from '@/scripts/categories';

const listsStore = useListStore()

const createListDialog = useTemplateRef('create-list')
const selectItemDialog = useTemplateRef('select-object-dialog')
const chooseImageDialog = useTemplateRef('choose-image-dialog')

const name = ref<string>()
const image = ref<{item: GameObjectId | null, image: string | null}>({
    item: null,
    image: null,
})
const tempItem = ref<GameObjectId>(null)
const gameObject = computed(() => gameData.getObject(image.value?.item))


function createList() {
    name.value = ''
    const randomObject = pickRandom(Object.values(gameData.data.categories[
        pickRandom(Object.keys(gameData.data.categories).filter(category => category in CATEGORIES) as CategoryName[])
    ].objects as GameObject[]))

    image.value.item = randomObject.id
    image.value.image = pickRandom(Object.keys(randomObject.image))
    
    nextTick(() => {
        createListDialog.value.open()
    })
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

function selectObject() {
    selectItemDialog.value.open()
}

function submitObject(objectId: GameObjectId) {
    tempItem.value = objectId
    selectImage()
}

function selectImage() {
    const tempObject = gameData.getObject(tempItem.value)
    if (Object.keys(tempObject.image).length <= 1) {
        submitImage(Object.keys(tempObject.image)[0])
    } else {
        chooseImageDialog.value.open()
    }
}

function submitImage(imageType: string) {
    image.value.item = tempItem.value
    image.value.image = imageType
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
            @click="selectObject()"
        ></GameCard>

        <template #menu>
            <button @click="createListDialog.submit()" class="button button-green">{{ $t('button.ok') }}</button>
            <button @click="createListDialog.cancel()" class="button button-red">{{ $t('button.cancel') }}</button>
        </template>
    </DialogComponent>

    <SelectObjectDialog
        ref="select-object-dialog"
        @submit="submitObject"
    >

    </SelectObjectDialog>

    <ChooseImageDialog
        ref="choose-image-dialog"
        :game-object="tempItem"
        :name="name || $t('lists.dialog.create_list.message.wishlist')"
        @submit="submitImage"
    >
    </ChooseImageDialog>
</template>

<style lang="css" scoped>

</style>
