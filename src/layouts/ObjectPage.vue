<script setup lang="ts">
import ObjectImage from '@/components/ObjectImage.vue';
import gameData from '@/scripts/gameData';
import type { GameObject, GameObjectId } from '@/types/gameDataTypes';
import { computed } from 'vue';


const props = defineProps<{
    gameObject: GameObjectId | GameObject,
}>()

const gameObject = computed(() => gameData.getObject(props.gameObject))
const name = computed(() => gameData.translateName(gameObject.value))

</script>

<template>
    <section class="section object-page">
        <div class="main-object-section">
            <div class="object-profile">
                <h1 class="name"><slot name="name">{{ name }}</slot></h1>
                <div>
                    <slot name="image">
                        <ObjectImage class="object-image" :object="gameObject" type="main"></ObjectImage>
                    </slot>
                </div>
            </div>
            <div class="object-info">
                <slot name="info"></slot>
            </div>
        </div>
    </section>
</template>

<style lang="css" scoped>
.object-page {
    container-type: inline-size;
}

.main-object-section {
    display: grid;
    grid-template-columns: 50% 50%;
}

@container (max-width: 35rem) {
    .main-object-section {
        grid-template-columns: auto;
    }
}

.object-profile {
    text-align: center;
    align-items: center;
}

.name {
    /* display: flex; */
    align-items: center;
    gap: 0.2em;
    overflow-wrap: anywhere;
}


</style>
