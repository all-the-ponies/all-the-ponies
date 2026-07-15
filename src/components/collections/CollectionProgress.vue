<script setup lang="ts">
import { computed, useId } from 'vue';


const props = defineProps<{
    value: number,
    total: number,
}>()

const value = computed(() => props.value)
const total = computed(() => props.total)
const percentage = computed(() => value.value / total.value)

const progressFillId = useId()

</script>

<template>
    <svg
        viewBox="0 0 53 8"
        role="progressbar"
        aria-valuemin="0"
        :aria-valuemax="total"
        :aria-valuenow="value"
        data-allow-mismatch
    >
        <defs>
            <pattern
                :id="progressFillId"
                width="6"
                height="10"
                patternTransform="rotate(12)"
                patternUnits="userSpaceOnUse"
                x="1.6"
            >
                <animateTransform
                    attributeName="patternTransform" 
                    type="translate" 
                    from="0 0" 
                    to="6 0" 
                    dur="5s"
                    repeatCount="indefinite"
                    additive="sum"
                />
                <rect
                    x="0"
                    y="0"
                    width="2.5"
                    height="10"
                    fill="#afee7f"
                />
                <rect
                    x="2.5"
                    y="0"
                    width="3.5"
                    height="10"
                    fill="#7fe92b"
                />
            </pattern>
        </defs>
        <path
            d="M 1.75 0.25 L 52.75 0.25 L 51.25 7.75 L 0.25 7.75 Z"
            stroke-width="0.5"
            stroke="#b4c7dafe"
            fill="#e8edf3ff"
        />
        <path
            :d="`M 2 0.5 l ${50.5 * percentage} 0 l -1.5 7 l -${50.5 * percentage} 0 z`"
            stroke-width="0.5"
            :fill="`url(#${progressFillId})`"
            data-allow-mismatch
        />
        <text
            x="26.5"
            y="7"
            font-family="Celestia Medium Redux, Arial, Helvetica, sans-serif"
            font-size="8"
            text-anchor="middle"
            fill="#0072B1"
            stroke="white"
            stroke-width="1"
            paint-order="stroke fill"
        >
            <tspan>{{value}}/{{total}}</tspan>
        </text>
    </svg>
</template>

<style lang="css" scoped>

</style>
