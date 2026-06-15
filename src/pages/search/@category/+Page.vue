<script setup lang="tsx">
import SearchComponent from '@/components/SearchComponent.vue';
import { CATEGORIES, FilterFunctions, PLURAL_CATEGORY_MAP, SortFunctions } from '@/scripts/categories';
import { useGameObjects, getNames } from '@/scripts/gameData';
import { computed } from 'vue';
// import { useSeoMeta } from '@unhead/vue';
import ObjectCard from '@/components/ObjectCard.vue';
import { useGameCardSize } from '@/composables/useGameCardSize';
import { useRem } from '@/composables/useRem';
import { useSaveStore } from '@/stores/saveManager';
import type { CategoryName, GameObject } from '@/types/gameDataTypes';
import { Config } from 'vike-vue/Config';
import { usePageContext } from 'vike-vue/usePageContext';
import { useI18n } from 'vue-i18n';

const pageContext = usePageContext()
const saveStore = useSaveStore()
const gameObjects = useGameObjects()

const { t } = useI18n()

const category = computed<CategoryName | null>(() => {
    return PLURAL_CATEGORY_MAP[pageContext.routeParams.category] || null
})

const categoryName = computed(() => t(CATEGORIES[category?.value].string, 2))

// useSeoMeta({
//     title: () => categoryName.value,
//     ogTitle: () => `${t('search.title')} ${categoryName.value}`,
// })

const sortFunctions = computed(() => {
    let functions = {
        ...SortFunctions.common
    }

    if (category.value in SortFunctions) {
        functions = {
            ...functions,
            ...SortFunctions[category.value],
        }
    }

    return functions
})

const filterFunctions = computed(() => {
    let functions = {
        ...FilterFunctions.common
    }

    if (category.value in FilterFunctions) {
        functions = {
            ...functions,
            ...FilterFunctions[category.value]
        }
    }

    console.log('Got filters', category.value)
    return functions
})

const objects = computed(() => {
    if (!gameObjects.value) {
        return []
    }
    const values = Object.values(gameObjects.value[category.value].objects) as GameObject[]
    return values
})

const cardSize = 9

const { width: itemWidth, height: itemHeight } = useGameCardSize(cardSize)
const itemGap = useRem(.3)

</script>

<template>
    <Config :title="categoryName">

    </Config>

    <SearchComponent
        v-if="category != null"
        :data="objects"
        :get-search-text="getNames"
        :get-exact-search-text="(item) => item.id"
        :sorters="sortFunctions"
        :filters="filterFunctions"
        :placeholder="$t(CATEGORIES[category].string)"
        page-param="page"
        save-url
        :item-width="itemWidth"
        :item-height="itemHeight"
        :item-gap="itemGap"
    >
        <template #item="{ item }">
            <ObjectCard
                class="item-card"
                :object="item"
                is-link
                hasButtons
            >
            </ObjectCard>
        </template>
    </SearchComponent>
    <div v-else>Not Found</div>
</template>

<style lang="css" scoped>
.item-card {
    --card-size: calc(v-bind('cardSize') * 1rem);
}
</style>
