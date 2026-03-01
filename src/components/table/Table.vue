<template>
    <table class="table">
        <slot></slot>
    </table>
</template>

<style lang="css">

.table {
    --border-radius: 1rem;
    --padding: 0.5rem 1rem;
    --border: 0.05rem solid var(--pink);

    border-collapse: separate;
    border-spacing: 0;
    border-radius: var(--border-radius);
    border: var(--border);

    overflow: hidden;
}

.table tr:not(:first-child) td {
    border-top: var(--border);
}

</style>
