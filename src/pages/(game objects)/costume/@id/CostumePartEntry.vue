<script setup lang="ts">
import CurrencyImage from '@/components/CurrencyImage.vue';
import { createAssetUrl } from '@/scripts/assets';
import type { CostumePartType } from '@/types/gameDataTypes';
import { computed } from 'vue';


const props = defineProps<{
    costumePart: CostumePartType
}>()

const costumePart = computed(() => props.costumePart)

</script>

<template>
    <div class="costume-part">
        <div class="part-image-container">
            <img class="part-image" :src="createAssetUrl(costumePart.image.main.path)" alt="">
        </div>
        <div class="part-info">
            <ul class="price-list"> 
                <template v-for="(amount, index) in costumePart.materials">
                    <li class="cost" v-if="amount">
                        <CurrencyImage :object="`PopCurrency${index + 1}`">
                            {{ $n(amount) }}
                        </CurrencyImage>
                    </li>
                </template>
                <li class="cost" v-if="costumePart.gem_price">
                    <CurrencyImage object="Gems">
                        {{ $n(costumePart.gem_price) }}
                    </CurrencyImage>
                </li>
            </ul>
        </div>
    </div>
</template>

<style lang="css" scoped>
.costume-part {
    display: grid;
    grid-template-columns: 5rem 1fr;
    min-height: 5rem;
    gap: 1rem;
    align-items: center;
    justify-items: center;
}

.part-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

.price-list {
    list-style: none;
}
</style>
