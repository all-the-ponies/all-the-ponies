<script setup lang="ts">
import { useData } from 'vike-vue/useData';
import type { Data } from './+data';
import { computed } from 'vue';
import { getObject, translateName } from '@/scripts/gameData';
import { Config } from 'vike-vue/Config';
import { useSaveStore } from '@/stores/saveManager';
import type { PonyType } from '@/types/gameDataTypes';
import Link from '@/components/Link.vue';
import LazyImage from '@/components/LazyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import CollectionReward from '@/components/collections/CollectionReward.vue';
import BackButton from '@/components/buttons/BackButton.vue';
import CollectionProgress from '@/components/collections/CollectionProgress.vue';
import { useMounted } from '@vueuse/core';


const data = useData<Data>()
const saveStore = useSaveStore()
const isMounted = useMounted()

const collection = computed(() => data.collection)
const title = translateName(collection)

const ponies = computed(() => {
    if (!collection.value) {
        return []
    }
    return collection.value.ponies.map(
        item => {
            let owned = saveStore.hasPony(item.item) || saveStore.hasPony(item.alt)
            const pony = getObject(item.item, 'pony')
            const alt: PonyType | null = getObject(item.alt, 'pony')

            if (pony.critter_farm) {
                owned = saveStore.critters[pony.critter_farm] >= item.count
            }
            
            return { pony, owned, alt }
        }
    )
})

const reorderedPonies = computed(() => {
    const rows = [[], []]

    for (let i = 0; i < ponies.value.length; i++) {
        rows[i % 2].push(ponies.value[i])
    }
    return [...rows[0], ...rows[1]]
})

const maxColumns = computed(() => Math.ceil(ponies.value.length / 2))

const mainReward = computed(() => ({
    item: getObject(collection.value.reward.main.item),
    amount: collection.value.reward.main.amount
}))

const altReward = computed(() => ({
    item: getObject(collection.value.reward.alt.item),
    amount: collection.value.reward.alt.amount
}))

const showAlt = computed(() => ['pony', 'shop'].includes(mainReward.value.item.category))

</script>

<template>
    <Config :title="title"></Config>

    <div>
        <BackButton fallback="/search/collections/"></BackButton>
        <h1 class="collection-title">{{ title }}</h1>
        <section class="collection-container section">
            <div class="collection">
                <div class="ponies-container">
                    <Link
                        v-for="{pony, owned, alt} in reorderedPonies"
                        :href="`/${pony.category}/${pony.id}`"
                        :key="pony.id"
                        class="pony link"
                        :class="{ 'unowned': isMounted && !owned }"
                    >
                        <span class="pony-name">{{ translateName(pony) }}</span>
                        <LazyImage class="pony-image" :src="createAssetUrl(pony.image.main.path)" />
                    </Link>
                </div>
                <div class="rewards">
                    <div class="reward-container">
                        <h2 class="reward-title">Reward</h2>
                        <CollectionReward
                            class="reward"
                            :item="mainReward.item"
                            :amount="mainReward.amount"
                        ></CollectionReward>
                    </div>
                    <div class="reward-container">
                        <template v-if="showAlt">
                            <span class="reward-title">Alt Reward</span>
                            <CollectionReward
                                class="reward"
                                :item="altReward.item"
                                :amount="altReward.amount"
                            ></CollectionReward>
                        </template>
                    </div>
                    <div class="progress-section">
                        <h2 class="progress-title">PROGRESS:</h2>
                        <CollectionProgress
                            class="progress-bar"
                            :value="ponies.filter(item => item.owned).length"
                            :total="ponies.length"
                        />
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style lang="css" scoped>

.collection-title {
    text-align: center;
}

.collection-container {
    container-type: inline-size;
}

.collection {
    display: grid;
    grid-template-columns: 1fr 10rem;
    gap: 0.8rem;
}

.ponies-container {
    --grid-layout-gap: 0.98rem;
    --grid-column-count: v-bind('maxColumns');
    --grid-item--min-width: 9rem;

    /**
    * Calculated values.
    */
    --gap-count: calc(var(--grid-column-count) - 1);
    --total-gap-width: calc(var(--gap-count) * var(--grid-layout-gap));
    --grid-item--max-width: calc((100% - var(--total-gap-width)) / var(--grid-column-count));

    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(max(var(--grid-item--min-width), var(--grid-item--max-width)), 1fr));
    grid-gap: var(--grid-layout-gap);
    
    /* display: grid;
    grid-template-columns: repeat(auto-fill, 9rem);
    gap: 0.8rem; */
    align-items: center;
    /* justify-items: center; */
    justify-content: center;
}

.pony {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 2;
    width: fit-content;
    align-items: center;
    justify-items: center;
    justify-content: center;
    text-align: center;
    justify-self: center;
}

.pony-image {
    height: 8rem;
    max-width: 100%;
    object-position: center;
    object-fit: contain;
}

.pony.unowned .pony-image {
    filter: brightness(0.6);
}

.rewards {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
    align-content: start;
    justify-content: center;
    padding: 0.3rem;

    background: #f2b42c;
    text-align: center;
    border-radius: 0.8em;
    /* box-shadow: inset 0px 0px 5px 2px hsl(41, 88%, 90%); */
    color: white;
    border: 0.2rem solid hsl(41, 91%, 40%);
}

.reward-container {
    display: grid;
}

.reward-title {
    align-self: flex-end;
}

.progress-section {
    align-self: center;
    /* justify-self: center; */
}

.progress-title {
    color: var(--blue);
    font-size: 1.4rem;
    -webkit-text-stroke: 0.3rem white;
    paint-order: stroke fill;
    margin-block: 0.4rem;
}

.progress-bar {
    max-width: 8rem;
}

@container (width < 40rem) {
    .collection {
        grid-template-columns: 1fr;
    }

    .rewards {
        grid-template-columns: 1fr 1fr 1fr;
    }

    .reward-container, .progress-section {
        grid-row: span 2;
    }

    .reward-container {
        grid-template-rows: subgrid;
    }
}

@container (width < 20rem) {
    .rewards {
        grid-template-columns: 1fr;
    }

    .reward-container, .progress-section {
        grid-row: revert;
    }

    .reward-container {
        grid-template-rows: revert;
    }
}

</style>
