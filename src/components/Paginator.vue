<script setup lang="ts">
import { computed } from 'vue'
import Link from './Link.vue'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'
import { isClient } from '@vueuse/core'

const pageContext = usePageContext()
const searchQuery = computed(() => pageContext.urlParsed.search)


const props = defineProps({
    modelValue: Number,
    perPage: Number,
    total: Number,
    maxPages: Number,
    param: String,
})

const emit = defineEmits(['update:modelValue'])

const page = computed({
    get() {
        if (props.modelValue > totalPages.value) {
            page.value =  Math.min(totalPages.value, totalPages.value)
        }
        return props.modelValue
    },
    set(value: number) {
        value = Math.min(Math.max(1, value), totalPages.value)
        if (props.param) {
            const query = { ...pageContext.urlParsed.search }
            query[props.param] = value.toString()
            if (isClient) {
                history.replaceState(null, '', 
                    modifyUrl(
                        pageContext.urlPathname,
                        {
                            search: query
                        }
                    ),
                )
            }
            
            // { overwriteLastHistoryEntry: true }
            // navigate(
            // )
        }
        return emit('update:modelValue', value)
    },
})

const perPage = computed(() => props.perPage)
const total = computed(() => props.total)
const maxPages = computed(() => props.maxPages)
const totalPages = computed(() => {
    if (total.value == 0) {
        return 1
    }
    const totalPages = Math.ceil(total.value / perPage.value)
    return totalPages
})

const pageList = computed(() => {
    const pages: Array<number | null> = []
    
    let start = Math.max(1, page.value - Math.floor(maxPages.value / 2))
    let end = Math.min(start + maxPages.value - 1, totalPages.value)
    start = Math.max(1, Math.min(start, end - maxPages.value + 1))

    for (let i = start; i <= end; i++) {
        pages.push(i)
    }

    return pages
})

if (props.param) {
    if (pageContext.urlParsed.search[props.param]) {
        page.value = Number(pageContext.urlParsed.search[props.param])
    }
}


</script>

<template>
<div v-if="props?.param" class="paginator-container" :class="totalPages == 1 ? 'hidden' : ''">
    <Link
     class="paginator-button back-button"
     @click.prevent.stop="page--"
     :class="{disabled: page <= 1}"
     :href="
        modifyUrl(
            pageContext.urlPathname,
            {
                search: {
                    ...searchQuery,
                    [$props.param]: String(Math.max(1, page - 1)),
                }
            }
        )
    "
     :replace="true"
    ><</Link>

    <Link
     class="paginator-button page-selector"
     :class="{selected: pageNum == page}"
     v-for="pageNum in pageList"
     :key="`page-${pageNum}`"
     @click.prevent.stop.capture="page = pageNum"
     :href="
        modifyUrl(
            pageContext.urlPathname,
            {
                search: {
                    ...searchQuery,
                    [$props.param]: String(pageNum),
                    }
                }
            )
        "
    >
        {{ pageNum }}
    </Link>

    <Link
     class="paginator-button forward-button"
     @click.prevent.stop="page++"
     :class="{disabled: page >= totalPages}"
     :href="
        modifyUrl(
            pageContext.urlPathname,
            {
                search: {
                    ...searchQuery,
                    [$props.param]: String(Math.min(page + 1, totalPages)),
                    }
                }
            )
        "
    >></Link>
</div>
<div v-else class="paginator-container" :class="totalPages == 1 ? 'hidden' : ''">
    <button
     class="paginator-button back-button"
     @click="page--"
     :disabled="page <= 1"
    ><</button>

    <button
     class="paginator-button page-selector"
     :class="{selected: pageNum == page}"
     v-for="pageNum in pageList"
     :key="`page-${pageNum}`"
     @click="page = pageNum"
    >
        {{ pageNum }}
    </button>

    <button
     class="paginator-button forward-button"
     @click="page++"
     :disabled="page >= totalPages"
    >></button>
</div>
</template>

<style scoped>
.paginator-container {
    /* width: 100%; */
    display: grid;
    justify-content: center;
    justify-items: stretch;
    font-size: 2rem;
    gap: 0.5rem;

    grid-template-columns: repeat( calc(v-bind('pageList?.length') + 2), 1fr );

    margin-block: 1rem;
}

.paginator-container.hidden {
    /* pointer-events: none;
    visibility: hidden; */
    display: none;
}

.paginator-button {
    font-size: 2rem;
    font-family: var(--font-family);
    background: none;
    border: none;
    color: var(--blue);

    cursor: pointer;
    text-decoration: none;

    /* width: 100%; */
    text-align: center;
}

button.paginator-button:not(:disabled):hover,
.paginator-button:not(.disabled):hover {
    text-decoration: underline;
}

button.paginator-button:disabled,
.paginator-button.disabled{
    color: var(--grey);
    cursor:default;
}

.selected {
    color: var(--pink);
}
</style>
