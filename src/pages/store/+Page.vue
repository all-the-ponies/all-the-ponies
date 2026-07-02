<script setup lang="ts">
import Loading from '@/components/Loading.vue'
import ObjectCard from '@/components/ObjectCard.vue'
import SearchComponent from '@/components/SearchComponent.vue'
import { useGameCardSize } from '@/composables/useGameCardSize'
import { useRem } from '@/composables/useRem'
import type { ShopEntry } from '@/scripts/api.types'
import { CATEGORIES, FilterFunctions, SortFunctions, type FilterFunctionsType } from '@/scripts/categories'
import { getNamesForSearch, getObject } from '@/scripts/gameData'
import { shopStore } from '@/stores/shopManager'
import type { CategoryName } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { Config } from 'vike-vue/Config'
import { usePageContext } from 'vike-vue/usePageContext'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const pageContext = usePageContext()

const loadingShop = shallowRef<boolean>(true)
const errorMessage = ref<string>('')
const selectedCategory = ref<CategoryName | 'seasonal-shop'>((pageContext.urlParsed.search.category as CategoryName) || 'pony')
const selectedFilters = ref<Record<string, boolean>>({})

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
            const result = Object.fromEntries(
                Object.entries(shop).filter(([id, info]) => 
                    info.in_shop && !info.hidden && (
                        !info.tags.includes('whthot')
                    )
                )
            )
            selectedFilters.value.sale = Object.values(result).some(entry => entry.price.sale.price || entry.price.sale.tokens)
            return result
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

    return Object.keys(shop.value).map((id) => getObject(id))
                .filter((gameObject) => gameObject !== null && gameObject.category != 'house')
})

const availableCategories = computed((): CategoryName[] => {
    const categoriesSet: Set<CategoryName> = new Set()

    gameObjects.value.forEach((gameObject) => categoriesSet.add(gameObject.category))

    const categoriesMap = Object.keys(CATEGORIES)

    let categories = [...categoriesSet]
    categories = categories.filter(c => CATEGORIES[c])
    
    console.log('categories', categories)
    
    return [...categories].sort((a, b) => categoriesMap.indexOf(a) - categoriesMap.indexOf(b))
})

const seasonalShopAvailable = computed(() => Object.values(shop.value).some(
    item => item.tags.includes('pvsar1') || item.tags.includes('pvsar2')
))

const isSpecialCategory = computed(() => ['seasonal-shop'].includes(selectedCategory.value))

const shownObjects = computed(() => {
    return gameObjects.value.filter((gameObject) => {
        if (selectedCategory.value === 'seasonal-shop') {
            return shop.value[gameObject.id].tags.includes('pvsar1') || shop.value[gameObject.id].tags.includes('pvsar2')
        }
        
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

    if (isSpecialCategory.value) {
        return functions
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
        sale: {
            name: 'common.sale',
            check(gameObject) {
                return Boolean(shop.value[gameObject.id]?.price.sale.price || shop.value[gameObject.id]?.price.sale.tokens)
            }
        },
        'new': {
            name: 'common.new',
            check(gameObject) {
                return shop.value[gameObject.id]?.tags?.includes('New')
            }
        }
    }

    if (isSpecialCategory.value) {
        return functions
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

const placeholder = computed(() => {
    switch (selectedCategory.value) {
        case 'seasonal-shop':
            return t(CATEGORIES.pony.string)
        default:
            return t(CATEGORIES[selectedCategory.value].string)
    }
})

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
            v-model:selected-filters="selectedFilters"
            :data="shop ? shownObjects : []"
            :get-search-text="getNamesForSearch"
            :get-exact-search-text="(item) => item.id"
            :filters="filterFunctions"
            :sorters="sortFunctions"
            :query="query"
            :placeholder="placeholder"
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
                    <option v-if="seasonalShopAvailable" value="seasonal-shop">{{ $t('store.message.seasonal_shop') }}</option>
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
