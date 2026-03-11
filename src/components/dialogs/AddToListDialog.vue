<script setup lang="ts">
import type { GameObjectId } from '@/types/gameDataTypes';
import DialogComponent from '../DialogComponent.vue';
import { computed, ref, useTemplateRef } from 'vue';
import { useListStore } from '@/stores/listStore';

const listStore = useListStore()

const props = defineProps<{
    gameObject: GameObjectId,
}>()

const listsDialog = useTemplateRef('lists-dialog')
const wishlists = computed(() => [...listStore.lists.keys()].filter(
    key => listStore.listHasItem(key, props.gameObject)
))
const _wishlists = ref<Map<number, boolean>>(new Map())

const emit = defineEmits<{
    open: [],
    close: [],
    cancel: [],
    submit: [],
}>()

function open() {
    _wishlists.value.clear()
    for (let id of listStore.lists.keys()) {
        _wishlists.value.set(id, wishlists.value.includes(id))
    }
    listsDialog.value.open()
}

function close() {
    listsDialog.value.close()
}

function submit() {
    for (let [id, inList] of _wishlists.value.entries()) {
        if (inList) {
            listStore.addItem(id, props.gameObject)
        } else {
            listStore.removeItem(id, props.gameObject)
        }
    }
    listsDialog.value.submit()
}

function cancel() {
    listsDialog.value.cancel()
}

defineExpose({
    open, close, submit, cancel
})



</script>

<template>
    <DialogComponent
        ref="lists-dialog"
        :title="$t('lists.dialog.add_to_list.title')"
        has-close-button
        @open="$emit('open')"
        @close="$emit('close')"
        @submit="$emit('submit')"
        @cancel="$emit('cancel')"
    >
        <div class="dialog-options">
            <label v-for="wishlist in listStore.lists.values()">
                <input
                    type="checkbox"
                    name="wishlist"
                    :key="`wishlist-${wishlist.id}`"
                    :value="wishlist.id"
                    :checked="_wishlists.get(wishlist.id)"
                    @change="(e) => _wishlists.set(wishlist.id, (<HTMLInputElement>e.target).checked)"
                >
                    {{ wishlist.name }}
            </label>
        </div>

        <template #menu>
            <button class="button button-green" @click="submit()">{{ $t('button.ok') }}</button>
            <button class="button button-red" @click="cancel()">{{ $t('button.cancel') }}</button>
        </template>
    </DialogComponent>
</template>

<style lang="css" scoped>
.dialog-options {
    display: flex;
    flex-direction: column;
}
</style>
