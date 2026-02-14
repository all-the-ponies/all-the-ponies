<template>
    <th>
        <slot></slot>
    </th>
</template>

<style lang="css" scoped>
th {
    /* border: 0.05rem solid var(--pink); */
    padding: var(--padding);
}

/* th:first-child:has(th:first-child) {
    border-top-left-radius: var(--border-radius);
}

th:last-child:where(th:first-child) {
    border-top-right-radius: var(--border-radius);
} */
</style>
