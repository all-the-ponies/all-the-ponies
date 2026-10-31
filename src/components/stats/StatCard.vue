<script setup lang="ts">
import { statNameMap } from "@/scripts/stats";
import type { PlayerStatName } from "@/types/gameDataTypes";
import { computed } from "vue";
import CollectionProgress from "../collections/CollectionProgress.vue";
import InfoButton from "../buttons/infoButton.vue";

const props = defineProps<{
    stat: PlayerStatName,
    value: number,
    total: number
}>()

const statImage = computed(() => statNameMap[props.stat].image)
const statName = computed(() => statNameMap[props.stat].string)
const statInfo = computed(() => statNameMap[props.stat].info)

</script>

<template>
    <div class="stat-card">
        <div class="stat-image-container">
            <img class="stat-image" :src="statImage" aria-hidden="true">
            <InfoButton v-if="statInfo" class="info-button" placement="top-start">{{ $t(statInfo) }}</InfoButton>
        </div>
        <div class="stat-body">
            <span class="stat-name">{{ $t(statName, 2) }}</span>
            <CollectionProgress
                :value="props.value"
                :total="props.total"
                :width="40"
            ></CollectionProgress>
        </div>
    </div>
</template>

<style lang="css" scoped>

.stat-card {
    display: flex;
    gap: 0.5rem;
}

.stat-image-container {
    position: relative;
}

.stat-image {
    width: 60px;
    object-fit: contain;
    object-position: center;
}

.stat-body {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.stat-name {
    font-size: 1rem;
    text-align: center;
}

.info-button {
    position: absolute;
    top: 0;
    right: 0;
}


</style>
