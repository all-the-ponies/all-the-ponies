<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue';
import GameCard from '@/components/GameCard.vue';
import CreateListDialog from '@/components/lists/createList/CreateListDialog.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { useGameCardSize } from '@/composables/useGameCardSize';
import { useRem } from '@/composables/useRem';
import { createAssetUrl } from '@/scripts/assets';
import { getObject } from '@/scripts/gameData';
import { useListStore, type Wishlist } from '@/stores/listStore';
import { ClientOnly } from 'vike-vue/ClientOnly';
import { ref, useTemplateRef } from 'vue';

const listsStore = useListStore()
const createListDialog = useTemplateRef('create-list-dialog')
const confirmDeleteDialog = useTemplateRef('confirm-delete-dialog')
const listToDelete = ref<Wishlist>()

function createList() {
    createListDialog.value.createList()
}

function getListImage(wishlist: Wishlist) {
    const gameObject = getObject(wishlist.image.item)
    if (!gameObject) {
        return
    }
    return gameObject.image[wishlist.image.image].path
}

async function deleteList(wishlist: Wishlist) {
    listToDelete.value = wishlist
    const willDelete = await confirmDeleteDialog.value.open()

    if (willDelete) {
        listsStore.lists.delete(wishlist.id)
    }
    listToDelete.value = null
}

const cardSize = 9
const { width: itemWidth, height: itemHeight } = useGameCardSize(cardSize)
const itemGap = useRem(.3)

</script>

<template>
    <div>
        <section class="section">
            <h1>{{ $t('lists.title') }}</h1>
            <button @click="createList" class="button button-blue">{{ $t('lists.button.create_list') }}</button>
        </section>
        <ClientOnly>
            <SearchComponent
                :data="[...listsStore.lists.values()]"
                :get-search-text="(item) => [item.name]"
                :placeholder="$t('lists.messages.wishlist')"
                save-url
                :item-width="itemWidth"
                :item-height="itemHeight"
                :item-gap="itemGap"
            >
                <template #item="{ item }">
                    <GameCard
                        class="item-card"
                        :title="item.name"
                        :image="createAssetUrl(getListImage(item))"
                        :href="`/list/${item.id}/`"
                    >
                        <template #right>
                            <button
                                class="button-circle button-red"
                                @click.stop.prevent="deleteList(item)"
                            >
                                -
                            </button>
                        </template>
                    </GameCard>
                </template>
                <template #empty>
                    <p>{{ $t('lists.messages.no_lists') }}</p>
                    <button @click="createList" class="button button-blue">{{ $t('lists.button.create_list') }}</button>

                </template>
            </SearchComponent>
        </ClientOnly>
    </div>

    <CreateListDialog ref="create-list-dialog"></CreateListDialog>

    <DialogComponent
        ref="confirm-delete-dialog"
        :title="$t('lists.dialog.confirm_delete.title')"
    >
        {{
            $t('lists.dialog.confirm_delete.body', {
                list: listToDelete.name
            })
        }}
        <template #menu>
            <button @click="confirmDeleteDialog.submit()" class="button button-red">{{ $t('button.yes') }}</button>
            <button @click="confirmDeleteDialog.cancel()" class="button button-green">{{ $t('button.no') }}</button>
        </template>
    </DialogComponent>
</template>

<style lang="css" scoped>
.item-card {
    --card-size: calc(v-bind('cardSize') * 1rem);
}
</style>
