<script setup lang="ts">
import { computedAsync } from '@vueuse/core';
import { computed, useId } from 'vue';


const props = defineProps<{
    level: number
}>()

const level = computed(() => props.level)

const levels = [
    1,
    6,
    12,
    20,
    30,
    40,
    60,
    80,
    100,
    120,
    140,
    160,
]

const levelGroup = computed(() => {
    let minLevel = 1
    for (let l of levels) {
        if (l > level.value) {
            break
        }
        minLevel = l
    }

    return minLevel
})

const levelImage = computedAsync(
    async () => (await import(`@/assets/images/ui/player-card/level-stars/${levelGroup.value}.png`)).default
)

const titleId = useId()

</script>

<template>
    <svg
        viewBox="0 0 85 85"
        role="img"
    >
        <title :id="titleId">{{ $t('player_card.level', {level}) }}</title>
        <image
            :href="levelImage"
            x="0"
            y="0"
            width="85"
            height="85"
            aria-hidden="true"
        ></image>

        <text
            font-size="18px"
            font-family="Celestia Medium Redux, Arial, Helvetica, sans-serif"
            fill="#ffffff"
            stroke="#75b0c2"
            stroke-width="1.6"
            paint-order="stroke fill markers"
            x="37"
            y="48"
            text-anchor="middle"
            aria-hidden="true"
            :aria-labelledby="titleId"
        >
          <tspan aria-hidden="true" :aria-labelledby="titleId"> {{ level }}</tspan>
        </text>
    </svg>
</template>
