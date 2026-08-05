<script setup lang="ts">
import { computed } from 'vue';


const props = withDefaults(defineProps<{
    type?: 'info' | 'note' | 'tip' | 'important' | 'warning' | 'error'
}>(), {
    type: 'note'
})

const types = {
    info: {
        class: 'card-type-info',
        string: 'info_card.info',
    },
    note: {
        class: 'card-type-note',
        string: 'info_card.note',
    },
    tip: {
        class: 'card-type-tip',
        string: 'info_card.tip',
    },
    important: {
        class: 'card-type-important',
        string: 'info_card.important',
    },
    warning: {
        class: 'card-type-warning',
        string: 'info_card.warning',
    },
    error: {
        class: 'card-type-error',
        string: 'info_card.error',
    },
}

const cardType = computed(() => props.type)

</script>

<template>
    <div :class="`info-card ${types[cardType].class}`">
        <p class="card-title"><slot name="title">{{ $t(types[cardType].string) }}</slot></p>
        <p class="card-body"><slot></slot></p>
    </div>
</template>

<style lang="css" scoped>

.info-card {
    position: relative;
    /* width: 100%; */
    margin: 0.5rem;
    margin-inline: auto;
    background-color: white;
    padding: 1rem;
    margin: 0.5rem;

    --border-color: var(--pink);

    --box-shadow: inset 0px 0px 6px var(--border-color);
    box-shadow: var(--box-shadow);
    border-radius: 0.8rem;
}

.card-type-info {
    --border-color: var(--blue);
}
.card-type-note {
    --border-color: var(--blue);
}
.card-type-tip {
    --border-color: var(--blue);
}

.card-title {
    font-size: 1.5rem;
}

.card-body {
    font-size: 1.2rem;
}

</style>
