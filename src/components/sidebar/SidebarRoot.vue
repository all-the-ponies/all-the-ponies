<template>
    <nav class="sidebar-nav">
        <ul class="sidebar-menu">
            <slot></slot>
        </ul>
        <div class="sidebar-footer">
            <slot name="footer"></slot>
        </div>
    </nav>
</template>

<style lang="css" scoped>

.sidebar-nav {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    gap: 0.2rem;
    background-color: var(--pink);
}

.sidebar-menu {
    display: flex;
    flex-direction: column;
}

.sidebar-footer {
    margin-top: 1rem;
}

</style>
