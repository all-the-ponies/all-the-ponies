<script setup lang="ts">
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed, useId } from 'vue';
import ObjectImage from '../ObjectImage.vue';


const props = defineProps<{
    item: GameObjectId | GameObject,
    amount: number,
}>()

const item = computed(() => props.item)
const amount = computed(() => props.amount)

const gradientId = useId()

</script>

<template>
    <svg viewBox="0 0 31 13.079" style="overflow: visible;">
        <defs>
            <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" gradientTransform="rotate(90)">
                <stop offset="0" stop-color="#f3d97e" />
                <stop offset="50%" stop-color="#efbe15" />
            </linearGradient>
        </defs>

        <path
            d="M 6.4494862 0.23409418
               H 27.148353
               c 2.003748 0 3.616873 1.61323872 3.616873 3.61712732
               v 5.3877949
               c 0 2.0038886 -1.613125 3.6171276 -3.616873 3.6171276
               H 6.4494862
               c -2.0037481 0 -3.6168737 -1.613239 -3.6168737 -3.6171276
               V 7.9788915
               L 0.47656103 6.5770765
               2.8326125 5.297458
               V 3.8512215
               c 0 -2.0038886 1.6131256 -3.61712732 3.6168737 -3.61712732
               z"
            stroke="#eea60bff"
            stroke-width="0.457"
            stroke-linecap="round"
            stroke-linejoin="round"
            :fill="`url(#${gradientId})`"
        />
        <foreignObject x="3" y="0.35" width="27.5" height="12.5" style="overflow: visible;">
            <div class="reward">
                <ObjectImage class="item-image" :object="item" type="portrait" />
                <span
                    v-if="amount > 1"
                    class="amount"
                    :style="{
                        paintOrder: 'stroke fill', // Safari edge-case
                    }"
                >{{ $n(amount) }}</span>
            </div>
        </foreignObject>
    </svg>
</template>

<style lang="css" scoped>

.reward {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    gap: 2px;
}

.item-image {
    max-width: 15px;
    max-height: 120%;
    min-height: 100%;
    object-fit: contain;
    object-position: bottom center;
    align-self: flex-end;
}

.amount {
    font-size: 8px;
    color: white;
    -webkit-text-stroke: 1px #af7721;
    paint-order: stroke fill;
}

</style>
