<script setup lang="ts">
import { getObject, translateName } from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed } from 'vue';
import Link from '../Link.vue';
import ObjectImage from '../ObjectImage.vue';


const props = defineProps<{
    item: GameObjectId | GameObject,
    amount: number,
}>()

const item = computed(() => getObject(props.item))
const amount = computed(() => props.amount)
const itemName = computed(() => {
    if (item.value && 'name' in item.value) {
        return translateName(item.value)
    }
})

const componentProps = computed(() => {
    if (item.value.category != 'item') {
        return {
            href: `/${item.value.category}/${item.value.id}/`
        }
    }
    return {}
})

</script>

<template>
    <component
        class="reward"
        :is="item.category != 'item' ? Link : 'div'"
        v-bind="componentProps"
    >
        <span class="item-name">{{ itemName }}</span>
        <div class="item-container">
            <ObjectImage class="item-image" :object="item" />
            <span v-if="amount > 1" class="amount">{{ $n(amount) }}</span>
        </div>
    </component>
</template>

<style lang="css" scoped>

.reward {
    display: grid;
    align-items: center;
    justify-content: center;
    
    text-align: center;
    color: white;
    text-decoration: none;
    position: relative;
}

.item-name {
    font-size: 1.2rem;
}

.item-container {
    position: relative;
    width: min-content;
    height: min-content;
}

.item-image {
    width: 5rem;
}

a.reward:hover {
    text-decoration: underline;
}

.amount {
    position: absolute;
    bottom: 0;
    right: 0;
}

</style>
