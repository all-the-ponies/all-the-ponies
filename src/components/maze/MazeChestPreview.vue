<script setup lang="ts">
import { getMazeChest, getMazeData } from '@/scripts/gameData';
import type { MazeChestType } from '@/types/gameDataTypes';
import { computed } from 'vue';
import MazeInfoContainer from './MazeInfoContainer.vue';
import MazePonyCard from './MazePonyCard.vue';

const mazeData = getMazeData()

const props = defineProps<{
    chestId: string | MazeChestType,
}>()
const emit = defineEmits(['close'])

const chest = computed(() => getMazeChest(props.chestId))
const chestRewards = computed(() => mazeData.chest_rewards[chest.value.tier])

</script>

<template>
    <MazeInfoContainer @close="emit('close')" class="chest-container">
        <template #title>
            {{ $t('maze.tile.chest') }}
        </template>

        <div class="chest-rewards">
            <MazePonyCard
                v-for="pony in chestRewards"
                :maze-pony="pony"
            ></MazePonyCard>
        </div>
    </MazeInfoContainer>
</template>

<style lang="css" scoped>

.chest-container {
    position: relative;
    /* width: 100%; */
    padding-block: 1rem;
    background-color: white;

    --border-color: hsl(211, 30%, 55%);

    --box-shadow: inset 0px 0px 6px var(--border-color);
    box-shadow: var(--box-shadow);
    border-radius: 0.8rem;
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

</style>
