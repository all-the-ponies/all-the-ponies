<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue';
import GameCard from '@/components/GameCard.vue';
import { createAssetUrl } from '@/scripts/assets';
import { staticImage } from '@/scripts/common';
import gameData from '@/scripts/gameData';
import type { GameObject, GameObjectId, RenamedFile } from '@/types/gameDataTypes';
import { computed, useTemplateRef } from 'vue';


const props = defineProps<{
    gameObject: GameObjectId | GameObject | null,
    name: string,
}>()

const emit = defineEmits<{
    open: [],
    close: [],
    submit: [imageType: string],
    cancel: [],
}>()

const imageDialog = useTemplateRef('image-dialog')

const gameObject = computed(() => gameData.getObject(props.gameObject))
const images = computed<Record<string, RenamedFile>>(() => gameObject.value?.image || {})

function open() {
    emit('open')
    imageDialog.value.open()
}

function close() {
    emit('close')
    imageDialog.value.close()
}

function submit(imageType: string) {
    emit('submit', imageType)
    imageDialog.value.submit()
}

function cancel() {
    emit('cancel')
    imageDialog.value.cancel()
}

defineExpose({
    open,
    close,
    submit,
    cancel,
})

</script>

<template>
    <DialogComponent
        ref="image-dialog"
        :title="$t('lists.dialog.choose_image.title')"
        has-close-button
    >
        <div class="images-container">
            <GameCard
                v-for="[imageType, image] in Object.entries(images)"
                :title="props.name"
                :image="createAssetUrl(image.path)"
                hover
                @click="submit(imageType)"
            >
    
            </GameCard>
        </div>
    </DialogComponent>
</template>

<style lang="css" scoped>
.images-container {
    --card-size: 9rem;
    
    display: grid;
    grid-template-columns: repeat(auto-fit, var(--card-size));
    gap: 0.3rem;
    justify-items: center;
    justify-content: center;

    margin: 0.5rem 0.2rem;
    max-width: 100cqw;
}
</style>
