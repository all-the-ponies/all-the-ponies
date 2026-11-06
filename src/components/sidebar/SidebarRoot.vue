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

    /* Fill the scroll content (which has min-height: 100%) without shrinking
       below its own content height. A percentage height can't be used here
       because the scroll content's height is auto by design. */
    flex: 1 0 auto;

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
