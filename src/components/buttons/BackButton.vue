<script setup lang="ts">
function goBack() {
    history.back()
}
</script>

<template>
    <button @click="goBack" class="back-button button-circle button-blue">←</button>
</template>

<style lang="css" scoped>
.back-button {
    font-size: 2rem;
}
</style>
