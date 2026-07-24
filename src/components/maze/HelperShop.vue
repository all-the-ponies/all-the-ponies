<script setup lang="ts">
import { getMazeData } from '@/scripts/gameData';
import MazePonyCard from './MazePonyCard.vue';
import { computed } from 'vue';
import PriceButton from '../buttons/PriceButton.vue';
import MazeInfoContainer from './MazeInfoContainer.vue';

const emit = defineEmits(['close'])

const props = defineProps<{
    shopId: string,
}>()

const mazeData = getMazeData()
const shopInfo = computed(() => mazeData.shops[props.shopId])
const tierData = computed(() => mazeData.shop_tiers[shopInfo.value.tier])

</script>

<template>
    <MazeInfoContainer class="maze-shop" @close="emit('close')">
        <template #title>Secret Shop</template>
        <div class="pony-card" v-for="pony in tierData.slots">
            <MazePonyCard :maze-pony="pony.id"></MazePonyCard>
            <PriceButton currency="Consumable_Maze_Tier0">{{ pony.price }}</PriceButton>
        </div>
    </MazeInfoContainer>

    <p style="width: 100%; min-width: 0;">
        Tip: Only buy the cheapest pony, and do not go back to previous shops
    </p>
</template>

<style lang="css" scoped>

.maze-shop {
    background-image: url('@/assets/images/ui/maze/helper-shop-background.png');
    background-repeat: repeat;
    background-size: 5rem;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;

    border-radius: 1rem;
    border: 1px solid hsl(281, 37%, 40%);

    padding-block: 1rem;
}

.pony-card {
    text-align: center;
}

</style>
