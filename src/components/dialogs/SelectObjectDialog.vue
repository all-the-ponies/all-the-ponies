<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import DialogComponent from '../DialogComponent.vue';
import type { CategoryName, GameObject, GameObjectId } from '@/types/gameDataTypes';
import SearchComponent from '../SearchComponent.vue';
import { CATEGORIES, FilterFunctions, SortFunctions } from '@/scripts/categories';
import gameData from '@/scripts/gameData';
import ObjectCard from '../ObjectCard.vue';
import { language } from '@/globals';

const props = defineProps<{

}>()

const emit = defineEmits<{
    open: [],
    close: [],
    submit: [gameObject: GameObjectId],
    cancel: [],
}>()

const selectDialog = useTemplateRef('select-dialog')

function open() {
    selectDialog.value.open()
}

function close() {
    selectDialog.value.close()
}

function submit(gameObject: GameObjectId) {
    emit('submit', gameObject)
    selectDialog.value.submit()
}

function cancel() {
    selectDialog.value.cancel()
}

defineExpose({
    open,
    close,
    submit,
    cancel,
})


function selectObject(objectId: GameObjectId) {
    submit(objectId)
}


const selectedCategory = ref<CategoryName>('pony')
const gameObjects = computed(() => Object.values(gameData.data.categories[selectedCategory.value].objects) as GameObject[])


const availableCategories = Object.keys(gameData.data.categories)
console.log(availableCategories)


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
    let functions = {
        ...FilterFunctions.common
    }

    if (selectedCategory.value in FilterFunctions) {
        functions = {
            ...functions,
            ...FilterFunctions[selectedCategory.value]
        }
    }

    return functions
})



</script>

<template>
    <DialogComponent
        ref="select-dialog"
        :title="$t('dialog.select_item.title')"
        has-close-button
        @open="$emit('open')"
        @close="$emit('close')"
        @cancel="$emit('cancel')"
    >
        <SearchComponent
            class="search-section"
            :data="gameObjects"
            :search-function="(query, items) => gameData.searchName(query, items, language.key)"
            :sorters="sortFunctions"
            :filters="filterFunctions"
            :placeholder="$t(CATEGORIES[selectedCategory].string)"
        >

            <template #menu-before>
                <select v-model="selectedCategory" class="dropdown" name="category">
                    <option
                        v-for="category in availableCategories.filter(category => category in CATEGORIES)"
                        :value="category"
                        :key="`category-${category}`"
                    >{{ $t(CATEGORIES[category].string, 2) }}</option>
                </select>
            </template>

            <template #item="{ item }">
                <ObjectCard
                    :object="item"
                    hover
                    @click="selectObject(item.id)"
                >

                </ObjectCard>
            </template>
        </SearchComponent>
    </DialogComponent>
</template>

<style lang="css" scoped>
.search-section {
    --background-color: white;
    width: min(100dvw, 50rem);
    max-width: 100%;
}
</style>
