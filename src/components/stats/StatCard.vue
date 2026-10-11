<script setup lang="ts">
import { statNameMap } from "@/scripts/stats";
import type { PlayerStatName } from "@/types/gameDataTypes";
import { computed } from "vue";
import CollectionProgress from "../collections/CollectionProgress.vue";

const props = defineProps<{
    stat: PlayerStatName,
    value: number,
    total: number
}>()

const statImage = computed(() => statNameMap[props.stat].image)
const statName = computed(() => statNameMap[props.stat].string)

</script>

<template>
    <div class="stat-card">
        <img class="stat-image" :src="statImage" aria-hidden="true">
        <div class="stat-body">
            <span class="stat-name">{{ $t(statName, 2) }}</span>
            <CollectionProgress
                :value="props.value"
                :total="props.total"
            ></CollectionProgress>
        </div>
    </div>
</template>

<style lang="css" scoped>

.stat-card {
    display: flex;
    gap: 0.5rem;
}

.stat-image {
    width: 60px;
    object-fit: contain;
    object-position: center;
}

.stat-name {
    font-size: 1rem;
}

.stat-body {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}


</style>
