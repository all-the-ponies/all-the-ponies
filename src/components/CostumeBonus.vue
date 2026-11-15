<script setup lang="ts">
import type { CostumeBonus } from '@/types/gameDataTypes';

defineProps<{bonus: CostumeBonus}>()
</script>

<template>
    <span class="costume-bonus">
        <img v-if="bonus.type == 'MineCart'" src="@/assets/images/ui/icons/minecart-icon.png" alt="Minecart bonus">
        <img v-if="bonus.type == 'MiniGames'" src="@/assets/images/ui/icons/costume-minigame-boost.png" alt="Minigame bonus">
        <img v-if="bonus.type == 'ShopProduction'" src="@/assets/images/ui/icons/bits-boost.png" alt="Bits bonus">
        +{{ $n(bonus.amount / 100, {style: 'percent'}) }}
    </span>
</template>

<style scoped>
.costume-bonus {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.costume-bonus img {
    height: 1em;
    object-fit: contain;
    object-position: center;
}
</style>
