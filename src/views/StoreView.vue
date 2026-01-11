<script setup lang="ts">
import SearchComponent from '@/components/SearchComponent.vue'
import { CATEGORIES, FilterFunctions, SortFunctions, type FilterFunctionsType } from '@/scripts/categories'
import gameData from '@/scripts/gameData'
import { shopStore } from '@/stores/shopManager'
import type { CategoryName } from '@/types/gameDataTypes'
import { useHead } from '@unhead/vue'
import { computedAsync } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

useHead({
    title: () => t('store.title'),
})

const route = useRoute()

const loadingShop = shallowRef<boolean>(false)
const selectedCategory = ref<CategoryName>((Array.isArray(route.query.category) ? route.query.category[0] as CategoryName : route.query.category as CategoryName) || 'pony')

const shop = computedAsync(
    async () => {
        return Object.fromEntries(
            Object.entries(
                await shopStore.shop
            ).filter(([id, info]) => info.in_shop && !info.hidden)
        )
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

</script>

<template>
    <div>
        <h1>{{ $t('store.title') }}</h1>
        <SearchComponent
            v-if="!loadingShop"
            :objects="shop ? shownObjects : []"
            :filters="filterFunctions"
            :sorters="sortFunctions"
            show-prices
            :query="{
                category: selectedCategory === 'pony' ? undefined : selectedCategory
            }"
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
        </SearchComponent>
    </div>
</template>
