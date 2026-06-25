<script setup lang="ts">
import { computed } from 'vue';


const props = defineProps<{
    rate: number,
}>()

const rate = computed(() => props.rate)

const rangeName = computed(() => {
    if (rate.value < 25) {
        return 'low'
    } else if (rate.value < 75) {
        return 'medium'
    } else {
        return 'high'
    }
})

</script>

<template>
    <div
        class="rate"
        :class="rangeName"
        role="meter"
        :aria-valuenow="rate"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Drop rate`"
    >
        <div
            class="fill-bar"
            :class="{full: rate >= 100}"
            :style="{width: `${rate}%`}"
        ></div>
    </div>
</template>

<style lang="css" scoped>

.rate.low {
    --bar-color: #e94733;
}

.rate.medium {
    --bar-color: #cfd41f;
}

.rate.high {
    --bar-color: #78db24;
}

.rate {
    background: #a43224;
    width: 100%;
    height: 6px;
    border-radius: 10px;
    overflow: hidden;
}

.fill-bar {
    height: 100%;
}

.fill-bar {
    background: var(--bar-color);
    border: 1px solid hsl(from var(--bar-color) h s calc(l - 5));
    border-top-left-radius: inherit;
    border-bottom-left-radius: inherit;
}

.fill-bar.full {
    border-top-right-radius: inherit;
    border-bottom-right-radius: inherit;
}

</style>
