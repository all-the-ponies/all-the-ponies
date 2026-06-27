<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue';
import SelectObjectDialog from '@/components/dialogs/SelectObjectDialog.vue';
import GameCard from '@/components/GameCard.vue';
import { createAssetUrl } from '@/scripts/assets.ts';
import { CATEGORIES } from '@/scripts/categories';
import { pickRandom } from '@/scripts/common';
import { useGameObjects, getObject } from '@/scripts/gameData';
import { useListStore, type Wishlist } from '@/stores/listStore';
import type { CategoryName, GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ChooseImageDialog from './ChooseImageDialog.vue';

const { t } = useI18n()
const gameObjects = useGameObjects()

const emit = defineEmits<{
    submit: [listId: Wishlist],
}>()

const listsStore = useListStore()

const createListDialog = useTemplateRef('create-list')
const selectItemDialog = useTemplateRef('select-object-dialog')
const chooseImageDialog = useTemplateRef('choose-image-dialog')

const name = ref<string>()
const errorMessage = ref<string>('')
const image = ref<{item: GameObjectId | null, image: string | null}>({
    item: null,
    image: null,
})
const tempItem = ref<GameObjectId>(null)
const gameObject = computed(() => getObject(image.value?.item))
const wishlistId = ref<number | null>(null)

watch(name, () => errorMessage.value = '')

function createList() {
    wishlistId.value = null
    name.value = ''
    const randomObject = gameObjects.value ? pickRandom(Object.values(gameObjects.value[
        pickRandom(Object.keys(gameObjects.value).filter(category => category in CATEGORIES) as CategoryName[])
    ].objects) as GameObject[]) as GameObject : null

    image.value.item = randomObject.id
    image.value.image = pickRandom(Object.keys(randomObject.image))
    
    nextTick(() => {
        createListDialog.value.open()
    })
}

function editList(listId: number) {
    wishlistId.value = listId
    const wishlist = listsStore.getList(listId)
    name.value = wishlist.name
    image.value.image = wishlist.image.image
    image.value.item = wishlist.image.item

    nextTick(() => {
        createListDialog.value.open()
    })
}

function submitList() {
    if (!name.value) {
        errorMessage.value = t('lists.dialog.create_list.message.name_required')
        return
    }
    
    try {
        let listId
        if (wishlistId.value === null) {
            listId = listsStore.createList(
                name.value,
                image.value,
                new Date(),
            )
        } else {
            listId = wishlistId.value
            const wishlist = listsStore.getList(listId)
            wishlist.name = name.value
            wishlist.image.image = image.value.image
            wishlist.image.item = image.value.item
        }
        createListDialog.value.submit()
        emit('submit', listId)
    } catch (error) {
        errorMessage.value = String(error)
    }
}

function cancelList() {
    createListDialog.value.cancel()
}

function selectObject() {
    selectItemDialog.value.open()
}

function submitObject(objectId: GameObjectId) {
    tempItem.value = objectId
    selectImage()
}

function selectImage() {
    const tempObject = getObject(tempItem.value)
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
    createList,
    editList,
})

</script>

<template>
    <DialogComponent
        ref="create-list"
        :title="$t('lists.dialog.create_list.title')"
    >

        {{ $t('lists.dialog.create_list.message.name') }}
        <input
            v-model="name"
            class="text-box"
            :placeholder="$t('lists.dialog.create_list.message.wishlist')"
            type="text"
            name="list-name"
            @keypress="(e) => {if (e.key === 'Enter') submitList()}"
        >

        <div class="error-message">
            {{ errorMessage }}
        </div>

        <div class="card-container">
            <GameCard
                :title="name || $t('lists.dialog.create_list.message.wishlist')"
                hover
                :image="createAssetUrl(gameObject ? gameObject.image[image.image].path : null)"
                @click="selectObject()"
            ></GameCard>
        </div>

        <template #menu>
            <button @click="submitList()" class="button button-green">{{ $t('button.ok') }}</button>
            <button @click="cancelList()" class="button button-red">{{ $t('button.cancel') }}</button>
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
.card-container {
    display: grid;
    justify-items: center;
    margin-bottom: 1rem;
}
</style>
