<script setup lang="ts">
import ObjectCard from '@/components/ObjectCard.vue'
import SearchComponent from '@/components/SearchComponent.vue'
import { language } from '@/globals'
import { CATEGORIES, FilterFunctions, SortFunctions, type FilterFunctionsType } from '@/scripts/categories'
import gameData from '@/scripts/gameData'
import { shopStore } from '@/stores/shopManager'
import type { CategoryName } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { Config } from 'vike-vue/Config'
import { usePageContext } from 'vike-vue/usePageContext'
import { computed, ref, shallowRef } from 'vue'


const pageContext = usePageContext()

const loadingShop = shallowRef<boolean>(false)
const selectedCategory = ref<CategoryName>((pageContext.urlParsed.search.category as CategoryName) || 'pony')

const shop = computedAsync(
    async () => {
        const shopStart = performance.now()
        const shop = await shopStore.shop
        if (shop) {
            console.log(`Got shop in ${(performance.now() - shopStart) / 1000}s`)
            return Object.fromEntries(
                Object.entries(shop).filter(([id, info]) => info.in_shop && !info.hidden)
            )
        }
        return {}
    },
    {},
    { evaluating: loadingShop },
)

const gameObjects = computed(() => {
    if (loadingShop.value) {
        return []
    }

    return Object.keys(shop.value).map((id) => gameData.getObject(id)).filter((gameObject) => gameObject !== null && gameObject.category != 'house')
})

const availableCategories = computed((): CategoryName[] => {
    const categories: Set<CategoryName> = new Set()

    gameObjects.value.forEach((gameObject) => categories.add(gameObject.category))

    const categoriesMap = Object.keys(CATEGORIES)
    
    console.log('categories', categories)
    
    return [...categories].sort((a, b) => categoriesMap.indexOf(a) - categoriesMap.indexOf(b))
})


const shownObjects = computed(() => {
    return gameObjects.value.filter((gameObject) => {
        if (gameObject.category !== selectedCategory.value) {
            return false
        }

        return true
    })
})



const sortFunctions = computed(() => {
    let functions = {
        ...SortFunctions.common
    }

    if (selectedCategory.value in SortFunctions) {
        functions = {
            ...functions,
            ...SortFunctions[selectedCategory.value],
        }
    }

    return functions
})

const filterFunctions = computed(() => {
    let functions: Record<string, FilterFunctionsType> = {
        ...FilterFunctions.common,
        'new': {
            name: 'common.new',
            check(gameObject) {
                return shop.value[gameObject.id]?.tags?.includes('New')
            }
        }
    }

    if (selectedCategory.value in FilterFunctions) {
        functions = {
            ...functions,
            ...FilterFunctions[selectedCategory.value],
        }
    }

    return functions
})

const query = computed(() => {
    return {
        category: selectedCategory.value === 'pony' ? undefined : selectedCategory.value
    }
})

</script>

<template>
    <Config :title="$t('store.title')" :description="$t('store.description')"></Config>

    <div>
        <h1>{{ $t('store.title') }}</h1>
        <SearchComponent
            :data="shop ? shownObjects : []"
            :search-function="(query, items) => gameData.searchName(query, items, language.key)"
            :filters="filterFunctions"
            :sorters="sortFunctions"
            :query="query"
            page-param="page"
        >
            <template #menu-before>
                <select v-model="selectedCategory" class="dropdown" name="category">
                    <option
                        v-for="category in availableCategories"
                        :value="category"
                        :key="`category-${category}`"
                    >{{ $t(CATEGORIES[category].string, 2) }}</option>
                </select>
            </template>
            <template #item="{ item }">
                <ObjectCard
                    :object="item"
                    is-link
                    show-inventory-button
                    show-price
                >
                </ObjectCard>
            </template>
        </SearchComponent>
    </div>
</template>
