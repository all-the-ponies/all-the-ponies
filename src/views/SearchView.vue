<script setup lang="tsx">
import SearchComponent from '@/components/SearchComponent.vue'
import gameData from '@/scripts/gameData'
import { computed, ref } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { CATEGORIES, SortFunctions, FilterFunctions, PLURAL_CATEGORY_MAP } from '@/scripts/categories'
import { useHead } from '@unhead/vue';
import { useI18n } from 'vue-i18n';
import type { GameObject } from '@/types/gameDataTypes';
import PriceButton from '@/components/buttons/PriceButton.vue';

const { t } = useI18n()

const route = useRoute()

const category = computed(() => {
    return PLURAL_CATEGORY_MAP[Array.isArray(route.params.category) ? route.params.category[0] : route.params.category] || null
})

const categoryName = computed(() => t(CATEGORIES[category.value].string, 2))

useHead({
    title: categoryName
})

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

</script>

<template>
    <SearchComponent
        v-if="category != null"
        :objects="Object.keys(gameData.data.categories[category].objects)"
        :sorters="sortFunctions"
        :filters="filterFunctions"
        :placeholder="$t(CATEGORIES[category].string)"
    ></SearchComponent>
    <div v-else>Not Found</div>
</template>
