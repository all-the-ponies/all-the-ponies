<script setup lang="ts">
import Loading from '@/components/Loading.vue'
import ObjectCard from '@/components/ObjectCard.vue'
import SearchComponent from '@/components/SearchComponent.vue'
import { useGameCardSize } from '@/composables/useGameCardSize'
import { useRem } from '@/composables/useRem'
import { language } from '@/globals'
import type { ShopEntry } from '@/scripts/api.types'
import { CATEGORIES, FilterFunctions, SortFunctions, type FilterFunctionsType } from '@/scripts/categories'
import gameData from '@/scripts/gameData'
import { shopStore } from '@/stores/shopManager'
import type { CategoryName } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { Config } from 'vike-vue/Config'
import { usePageContext } from 'vike-vue/usePageContext'
import { computed, ref, shallowRef } from 'vue'


const pageContext = usePageContext()

const loadingShop = shallowRef<boolean>(true)
const errorMessage = ref<string>('')
const selectedCategory = ref<CategoryName>((pageContext.urlParsed.search.category as CategoryName) || 'pony')

const shop = computedAsync(
    async () => {
        const shopStart = performance.now()
        let shop: Record<string, ShopEntry>
        errorMessage.value = ''
        try {
            shop = await shopStore.shop
        } catch (error) {
            errorMessage.value = String(error)
            return {}
        }
        if (shop) {
            console.log(`Got shop in ${(performance.now() - shopStart) / 1000}s`)
            return Object.fromEntries(
                Object.entries(shop).filter(([id, info]) => 
                    info.in_shop && !info.hidden && (
                        !info.tags.includes('whthot')
                    )
                )
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

        const price = shop.value[gameObject.id]
        if (price.price.base.currency === 'Lotto') {
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

const cardSize = 9
const { width: itemWidth, height: itemHeight } = useGameCardSize(cardSize)
const itemGap = useRem(.3)

</script>

<template>
    <Config :title="$t('store.title')" :description="$t('store.description')"></Config>

    <div class="page-fill page">
        <h1>{{ $t('store.title') }}</h1>
        <!-- <div v-if="loadingShop">
            <img src="@/assets/images/ui/loading.webp" alt="Loading...">
        </div> -->
        <SearchComponent
            class="search"
            :data="shop ? shownObjects : []"
            :get-search-text="gameData.getNamesForSearch"
            :get-exact-search-text="(item) => item.id"
            :filters="filterFunctions"
            :sorters="sortFunctions"
            :query="query"
            :placeholder="$t(CATEGORIES[selectedCategory].string)"
            page-param="page"
            save-url
            :item-width="itemWidth"
            :item-height="itemHeight"
            :item-gap="itemGap"
        >
            <template #empty>
                <template v-if="loadingShop">
                    <Loading class="loading" />
                </template>
                <template v-else>
                    <div class="error-message">
                        {{ errorMessage }}
                    </div>
                </template>
            </template>
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
                    class="item-card"
                    :object="item"
                    is-link
                    hasButtons
                    show-price
                >
                </ObjectCard>
            </template>
        </SearchComponent>
    </div>
</template>

<style lang="css" scoped>
.page {
    display: flex;
    flex-direction: column;
}

.search {
    flex: 1;
}

.item-card {
    --card-size: calc(v-bind('cardSize') * 1rem);
}
</style>
