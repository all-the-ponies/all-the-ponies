<script setup lang="ts">
import { getMazeChest, getMazeData, getObject } from '@/scripts/gameData';
import type { GameObject, GameObjectId, MazeChestType } from '@/types/gameDataTypes';
import { computed } from 'vue';
import MazeInfoContainer from './MazeInfoContainer.vue';
import MazePonyCard from './MazePonyCard.vue';
import ObjectCard from '../ObjectCard.vue';
import CurrencyImage from '../CurrencyImage.vue';
import { formatTime } from '@/scripts/timeFunctions.ts';

const mazeData = getMazeData()

const props = defineProps<{
    shopId: GameObjectId | GameObject,
}>()
const emit = defineEmits(['close'])

const shop = computed(() => getObject(props.shopId, 'shop'))
const product = computed(() => getObject(shop.value?.product, 'consumable'))

</script>

<template>
    <MazeInfoContainer @close="emit('close')" class="shop-info-container">
        <template #title>
            {{ $t('maze.tile.coin_shop') }}
        </template>

        <div class="shop-info">
            <ObjectCard class="shop-card" :object="shop" is-link></ObjectCard>
            <div class="product-info">
                <p class="product-title">{{ $t('maze.message.coin_shop.produces') }}</p>
                <p><CurrencyImage :object="product.id">{{ $n(product.consume.tls) }}</CurrencyImage></p>
                <p>
                    {{ $t('maze.message.coin_shop.time', {
                        duration: formatTime(product.time),
                    }) }}
                </p>
                <i18n-t keypath="maze.message.coin_shop.skip_cost" tag="p">
                    <template #cost>
                        <CurrencyImage object="Gems">{{ $n(product.skip_cost) }}</CurrencyImage>
                    </template>
                </i18n-t>
            </div>
        </div>
    </MazeInfoContainer>
</template>

<style lang="css" scoped>

.shop-info-container {
    position: relative;
    /* width: 100%; */
    max-width: 30rem;
    padding-block: 1rem;
    padding-inline: 0.5rem;
    margin-inline: auto;
    background-color: white;

    --border-color: hsl(211, 30%, 55%);

    --box-shadow: inset 0px 0px 6px var(--border-color);
    box-shadow: var(--box-shadow);
    border-radius: 0.8rem;
}

.shop-info {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, 8rem);
    align-items: center;
    justify-content: space-evenly;
    justify-items: center;
}

.chest-rewards {
    display: grid;
    grid-template-columns: repeat(auto-fit, 7.5rem);
    align-items: center;
    justify-content: center;
    justify-items: center;
    max-height: 21rem;
    overflow-y: auto;
}

.shop-card {
    --card-size: 8rem;
}

.product-info {
    text-align: center;
    line-height: 1.5;
}

.product-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

</style>
