<script setup lang="ts">
import BackButton from '@/components/buttons/BackButton.vue';
import CreateListDialog from '@/components/lists/createList/CreateListDialog.vue';
import ObjectCard from '@/components/ObjectCard.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { language } from '@/globals';
import { FilterFunctions, SortFunctions } from '@/scripts/categories';
import { staticImage } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import { useListStore, type Wishlist } from '@/stores/listStore';
import { useData } from 'vike-vue/useData';
import { usePageContext } from 'vike-vue/usePageContext'
import { render } from 'vike/abort';
import { computed, useTemplateRef } from 'vue';

const listStore = useListStore()
const pageContext = usePageContext()

const createListDialog = useTemplateRef('create-list-dialog')

// const { wishlist } = useData<{wishlist: Wishlist}>()

const wishlist = computed(() => {
    const listId = Number(pageContext.routeParams.id)
    if (!listStore.lists.has(listId)) {
        throw render(404, `Wishlist with id ${listId} does not exist. Lists cannot be shared between people.`)
    }

    return listStore.getList(listId)
})
console.log('wishlist', wishlist.value)

const objects = computed(() => wishlist.value.items.map(item => {
    return {
        ...item,
        item: gameData.getObject(item.item),
        id: item.item,
    }
}))

function editList() {
    createListDialog.value.editList(wishlist.value.id)
}

function searchObjects(query: string, items: typeof objects.value) {
    const filtered = gameData.searchName(query, items.map(item => item.item), language.value.key)
    return filtered.map(gameObject => items.find(item => item.id === gameObject.id))
}


const sortFunctions = computed(() => {
    let functions = {
        date_added: {
            name: 'sorting.date_added',
            check(a, b) {
                const date1 = new Date(a.dateAdded)
                const date2 = new Date(b.dateAdded)
                return date1.getTime() - date2.getTime()
            },
            default: true,
        },
        index: {
            name: 'sorting.game_order',
            check(a, b) {
                return a.item.index - b.item.index
            },
        },
        alphabetically: {
            name: 'sorting.alphabetically',
            check(a, b) {
                const name1 = gameData.translateName(a.item).value
                const name2 = gameData.translateName(b.item).value
                return new Intl.Collator(language.value.code).compare(name1, name2)
            }
        },
    }

    return functions
})

// const filterFunctions = computed(() => {
//     let functions = {
//         ...FilterFunctions.common
//     }
// 
//     // if (selectedCategory.value in FilterFunctions) {
//     //     functions = {
//     //         ...functions,
//     //         ...FilterFunctions[selectedCategory.value]
//     //     }
//     // }
// 
//     return functions
// })

</script>

<template>
    <div>
        <BackButton fallback="/lists"></BackButton>
        <section class="section">
            <h1>{{ wishlist.name }}</h1>
            <button @click="editList" class="button button-blue">{{ $t('lists.button.edit') }}</button>
        </section>
        <section class="section">
            <SearchComponent
                :data="objects"
                :search-function="searchObjects"
                :placeholder="$t('lists.messages.wishlist')"
                :sorters="sortFunctions"
                save-url
            >
                <template #item="{ item }">
                    <ObjectCard
                        :object="item.item"
                        hasButtons
                        is-link
                    >
                    </ObjectCard>
                </template>
            </SearchComponent>
        </section>

        <CreateListDialog
            ref="create-list-dialog"
        >
        </CreateListDialog>
    </div>
</template>
