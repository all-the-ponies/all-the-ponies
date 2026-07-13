<script setup lang="ts">
import CollectionCard from '@/components/collections/CollectionCard.vue';
import SearchComponent from '@/components/SearchComponent.vue';
import { useCollectionCardSize } from '@/composables/useCollectionCardSize';
import { useRem } from '@/composables/useRem';
import { language } from '@/globals';
import { getCollectionData } from '@/scripts/gameData';
import { Config } from 'vike-vue/Config';
import { computed } from 'vue';

const collectionData = getCollectionData()

const collections = Object.values(collectionData.collections)

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
                :get-search-text="(collection) => [collection.name[language.key]]"
                :get-exact-search-text="(collection) => collection.id"
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
