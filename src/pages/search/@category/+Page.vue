<script setup lang="tsx">
import SearchComponent from '@/components/SearchComponent.vue'
import gameData from '@/scripts/gameData'
import { computed, ref, watchEffect } from 'vue';
import { CATEGORIES, SortFunctions, FilterFunctions, PLURAL_CATEGORY_MAP } from '@/scripts/categories'
// import { useSeoMeta } from '@unhead/vue';
import { useI18n } from 'vue-i18n';
import type { CategoryName, GameObject } from '@/types/gameDataTypes';
import PriceButton from '@/components/buttons/PriceButton.vue';
import { Config } from 'vike-vue/Config';
import { usePageContext } from 'vike-vue/usePageContext';
import { useSaveStore } from '@/stores/saveManager';
import { language } from '@/globals';
import ObjectCard from '@/components/ObjectCard.vue';
import { useRem } from '@/composables/useRem';
import { useMounted } from '@vueuse/core';
import { useGameCardSize } from '@/composables/useGameCardSize';

const pageContext = usePageContext()
const saveStore = useSaveStore()

const { t } = useI18n()

const category = computed<CategoryName | null>(() => {
    return PLURAL_CATEGORY_MAP[pageContext.routeParams.category] || null
})

const categoryName = computed(() => t(CATEGORIES[category?.value].string, 2))

// useSeoMeta({
//     title: () => categoryName.value,
//     ogTitle: () => `${t('search.title')} ${categoryName.value}`,
// })

// console.log('ponies', Object.keys(gameData.data.categories.ponies.objects))

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

    return functions
})

function infoGetter(gameObject: GameObject) {
    // return <PriceButton currency='Bits'>10,000</PriceButton>
}

const objects = computed(() => Object.values(gameData.data.categories[category.value].objects as GameObject[]))

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
        :get-search-text="gameData.getSearchText"
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
