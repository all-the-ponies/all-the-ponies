<script setup lang="ts">
import CollectionCard from '@/components/collections/CollectionCard.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { useCollectionCardSize } from '@/composables/useCollectionCardSize';
import { useRem } from '@/composables/useRem';
import { language } from '@/globals';
import { SortFunctions } from '@/scripts/categories';
import { getCollectionData, getObject, translateName } from '@/scripts/gameData';
import type { CollectionType } from '@/types/gameDataTypes';
import type { SortFunctionType } from '@/types/searchTypes';
import { Config } from 'vike-vue/Config';
import { computed } from 'vue';

const collectionData = getCollectionData()

const collections = Object.values(collectionData.collections)

function getSearchText(collection: CollectionType) {
    const names: string[] = [translateName(collection).value]

    for (let item of collection.ponies) {
        if (!names.includes(item.item)) {
            names.push(translateName(getObject(item.item, 'pony')).value)
        }
        if (item.alt && !names.includes(item.alt)) {
            names.push(translateName(getObject(item.alt, 'pony')).value)
        }
    }

    const reward = getObject(collection.reward.main.item)
    const rewardName = translateName(reward).value

    if (!names.includes(rewardName)) {
        names.push(rewardName)
    }

    return names
}

function getExactSearchText(collection: CollectionType) {
    const ids: string[] = [collection.id]
    for (let item of collection.ponies) {
        if (!ids.includes(item.item)) {
            ids.push(item.item)
        }
        if (item.alt && !ids.includes(item.alt)) {
            ids.push(item.alt)
        }
    }

    if (!ids.includes(collection.reward.main.item)) {
        ids.push(collection.reward.main.item)
    }

    return ids
}

const sortFunctions: Record<string, SortFunctionType<CollectionType>> = {
    index: {
        name: 'sorting.game_order',
        check(a, b) {
            if (a.id > b.id) return 1
            if (a.id < b.id) return -1
            return 0
        },
        default: true,
    },
    alphabetically: SortFunctions.common.alphabetically,
}

const cardSize = 9
const { width: cardWidth, height: cardHeight } = useCollectionCardSize(cardSize)
const itemGap = useRem(.3)

</script>

<template>
    <Config :title="$t('collection.collection', 2)"></Config>

    <div>
        <section>
            <h1>{{ $t('collection.collection', 2) }}</h1>
        </section>
        <section>
            <SearchComponent
                :data="collections"
                :item-width="cardWidth"
                :item-height="cardHeight"
                :placeholder="$t('collection.collection')"
                :get-search-text="getSearchText"
                :get-exact-search-text="getExactSearchText"
                :sorters="sortFunctions"
                :item-gap="itemGap"
                save-url
            >
                <template #item="{ item }">
                    <CollectionCard :collection="item" :href="`/collection/${item.id}`" class="item-card"></CollectionCard>
                </template>
            </SearchComponent>
        </section>
    </div>
</template>

<style lang="css" scoped>

.item-card {
    /* margin: 0 1rem 1rem 0; */
}

</style>
