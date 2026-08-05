<template>
    <p class="sidebar-label"><slot></slot></p>
</template>

<style lang="css" scoped>

.sidebar-label {
    font-size: 0.75em;
    padding-top: 0.3em;
    padding-bottom: 0.1em;
    padding-inline: calc(var(--padding-inline) - 0.2em);
}

</style>
