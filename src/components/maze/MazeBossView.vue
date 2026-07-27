<script setup lang="ts">
import { getMazeBoss, getMazeChest, getMazeData, getMazePony, getObject } from '@/scripts/gameData';
import type { GameObject, GameObjectId, MazeBossType, MazeChestType } from '@/types/gameDataTypes';
import { computed } from 'vue';
import MazeInfoContainer from './MazeInfoContainer.vue';
import MazePonyCard from './MazePonyCard.vue';
import ObjectCard from '../ObjectCard.vue';
import CurrencyImage from '../CurrencyImage.vue';
import { formatTime } from '@/scripts/timeFunctions.ts';
import ObjectImage from '../ObjectImage.vue';

const mazeData = getMazeData()

const props = defineProps<{
    bossId: string | MazeBossType,
}>()
const emit = defineEmits(['close'])

const boss = computed(() => getMazeBoss(props.bossId))
const bossPony = computed(() => getObject(boss.value.pony, 'pony'))

const chest = computed(() => getMazeChest(boss.value.drop_chest))
const chestDrops = computed(() => chest.value ? mazeData.chest_rewards[chest.value.tier] : [])

const rewards = computed(() => boss.value.rewards.filter(reward => getObject(reward.item)))
const ponyReward = computed(() => boss.value.rewards.find(reward => getMazePony(reward.item)))

</script>

<template>
    <MazeInfoContainer @close="emit('close')" class="info-container">
        <template #title>
            {{ $t('maze.tile.boss') }}
        </template>

        <div class="boss-info">
            <ObjectCard class="boss-card" :object="boss.pony" is-link></ObjectCard>
            <div class="fight-info">
                <p>Required Energy: {{ $n(boss.required_energy) }} <img class="item-icon" src="@/assets/images/ui/maze/maze-energy-icon.png" alt="Maze Energy"></p>
                <p>Required Power: {{ $n(boss.required_power) }} <img class="item-icon" src="@/assets/images/ui/maze/maze-power-icon.png" alt="Maze Power"></p>
            </div>
        </div>
    </MazeInfoContainer>
    <MazeInfoContainer class="info-container" no-close-button>
        <template #title>
            Rewards
        </template>

        <div class="rewards-info">
            <div class="pony-reward">
                <MazePonyCard v-if="ponyReward" :maze-pony="ponyReward.item"></MazePonyCard>
            </div>
            <div class="item-rewards">
                <template v-for="reward in rewards">
                    <div class="item-reward">
                        <ObjectImage
                            :object="reward.item == 'tls_currency' ? 'Consumable_Maze_Tier0' : reward.item"
                            class="reward-image"
                        ></ObjectImage>
                        <span>+{{ $n(reward.amount) }}</span>
                    </div>
                </template>
            </div>
        </div>
    </MazeInfoContainer>
    <MazeInfoContainer class="info-container" no-close-button v-if="chestDrops.length">
        <template #title>
            {{ $t('maze.tile.chest') }}
        </template>

        <div class="chest-rewards">
            <MazePonyCard
                v-for="pony in chestDrops"
                :maze-pony="pony"
            ></MazePonyCard>
        </div>
    </MazeInfoContainer>
</template>

<style lang="css" scoped>

.info-container {
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

.boss-info {
    text-align: center;
}

.boss-card {
    --card-size: 8rem;
    margin-bottom: 0.5rem;
}

.fight-info {
    text-align: center;
    line-height: 1.5;
}

.item-icon {
    height: 1em;
    object-fit: contain;
    object-position: center;
}



.rewards-info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    min-height: 11rem;
}

.pony-reward {
    align-self: center;
}

.item-rewards {
    display: grid;
}

.item-reward {
    display: grid;
    grid-template-columns: subgrid;
    grid-column: span 2;
    align-items: center;
    justify-items: center;
}

.reward-image {
    height: 1.5em;
}



.chest-rewards {
    display: grid;
    grid-template-columns: repeat(auto-fit, 7.5rem);
    align-items: center;
    justify-content: center;
    justify-items: center;
    max-height: 22rem;
    overflow-y: auto;
}

</style>
