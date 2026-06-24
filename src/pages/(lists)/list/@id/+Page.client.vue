<script setup lang="ts">
import BackButton from '@/components/buttons/BackButton.vue';
import Link from '@/components/Link.vue';
import CreateListDialog from '@/components/lists/createList/CreateListDialog.vue';
import ObjectCard from '@/components/ObjectCard.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { useGameCardSize } from '@/composables/useGameCardSize';
import { useRem } from '@/composables/useRem';
import { language } from '@/globals';
import { getNames, getObject, translateName } from '@/scripts/gameData';
import { useListStore } from '@/stores/listStore';
import { computedAsync } from '@vueuse/core';
import { usePageContext } from 'vike-vue/usePageContext';
import { render } from 'vike/abort';
import { computed, ref, useTemplateRef, watchEffect } from 'vue';

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


// We use a ref and watchEffect instead of computedAsync because of
// a race condition when going back to the lists page

const objects = computed(() => {
    return wishlist.value.items.map((item) => {
        return {
            ...item,
            item: getObject(item.item),
            id: item.item,
        }
    })
})

function editList() {
    createListDialog.value.editList(wishlist.value.id)
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
                const name1 = translateName(a.item).value
                const name2 = translateName(b.item).value
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

const cardSize = 9
const { width: itemWidth, height: itemHeight } = useGameCardSize(cardSize)
const itemGap = useRem(.3)

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
                :get-search-text="(item) => getNames(item.item)"
                :placeholder="$t('lists.messages.wishlist')"
                :sorters="sortFunctions"
                save-url
                :item-width="itemWidth"
                :item-height="itemHeight"
                :item-gap="itemGap"
            >
                <template #item="{ item }">
                    <ObjectCard
                        class="item-card"
                        :object="item.item"
                        hasButtons
                        is-link
                    >
                    </ObjectCard>
                </template>
                <template #empty>
                    <i18n-t keypath="lists.messages.empty_list" tag="p">
                        <template #ponies>
                            <Link href="/search/ponies" class="link">
                                {{ $t('game_object.pony.pony', 2) }}
                            </Link>
                        </template>
                    </i18n-t>
                </template>
            </SearchComponent>
        </section>

        <CreateListDialog
            ref="create-list-dialog"
        >
        </CreateListDialog>
    </div>
</template>

<style lang="css" scoped>
.item-card {
    --card-size: calc(v-bind('cardSize') * 1rem);
}
</style>
