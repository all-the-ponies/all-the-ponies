<template>
    <div class="table-container">
        <table class="table">
            <slot></slot>
        </table>
    </div>
</template>

<style lang="css">

.table-container {
    width: fit-content;
    max-width: 100%;
    overflow-x: scroll;
}


.table {
    --border-radius: 1rem;
    --padding: 0.5rem 1rem;
    --border: 0.05rem solid var(--pink);

    border-collapse: separate;
    border-spacing: 0;
    border-radius: var(--border-radius);
    border: var(--border);

    min-width: 30rem;

    overflow: hidden;
}

.table tr:not(:first-child) td {
    border-top: var(--border);
}

</style>
