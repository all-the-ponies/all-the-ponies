<script setup lang="ts">
import GameCard from '@/components/GameCard.vue';
import CreateListDialog from '@/components/lists/createList/CreateListDialog.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { staticImage, transformName } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import { useListStore, type Wishlist } from '@/stores/listStore';
import { useTemplateRef } from 'vue';

const listsStore = useListStore()
const createListDialog = useTemplateRef('create-list-dialog')

console.log(listsStore.lists)

function createList() {
    createListDialog.value.createList()
}

function searchFilters(query: string, items: Wishlist[]) {
    const normalizedQuery = transformName(query)
    
    return items.filter(item => 
        transformName(item.name).includes(normalizedQuery)
    )
}

function getListImage(wishlist: Wishlist) {
    const gameObject = gameData.getObject(wishlist.image.item)
    if (!gameObject) {
        return
    }
    return gameObject.image[wishlist.image.image]
}

</script>

<template>
    <div>
        <section class="section">
            <h1>{{ $t('lists.title') }}</h1>
            <button @click="createList" class="button button-blue">{{ $t('lists.create_list') }}</button>
        </section>
        <SearchComponent
            :data="[...listsStore.lists.values()]"
            :search-function="searchFilters"
            :placeholder="$t('Wishlist')"
        >
            <template #item="{ item }">
                <GameCard
                    :title="item.name"
                    :image="staticImage(getListImage(item))"
                >
                    <template #right>
                        <button
                            class="button-circle button-red"
                            @click.stop.prevent="listsStore.lists.delete(item.id)"
                        >
                            -
                        </button>
                    </template>
                </GameCard>
            </template>
        </SearchComponent>
    </div>

    <CreateListDialog ref="create-list-dialog"></CreateListDialog>
</template>
