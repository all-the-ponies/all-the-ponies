<script setup lang="ts">
import { computed, type AnchorHTMLAttributes } from 'vue';
import Link from '../Link.vue';


const props = defineProps<{
    href?: AnchorHTMLAttributes['href'],
}>()

const elementProps = computed(() => {
    if (props.href) {
        return {
            href: props.href
        }
    }
    return {}
})

</script>

<template>
    <component :is="props.href ? Link : 'button'" class="collection-button button-circle button-blue" v-bind="elementProps">
        <img class="collection-icon" src="@/assets/images/ui/icons/collection-icon.png" :alt="$t('collection.collection')">
    </component>
</template>

<style lang="css" scoped>

.collection-button {
    /* padding: 0.2rem; */
    padding-top: 0;
    font-size: 1.5em;
}

.collection-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    margin-top: -10%;

    transition: transform 100ms linear;
}

.collection-button:hover .collection-icon {
    transform: translate(0, -0.1rem);
}

</style>
