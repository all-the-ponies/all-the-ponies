<script lang="ts" setup generic="ITEM extends {id: string | number, [key: string]: any}">
import type { FilterFunctionsType, SortFunctionsType } from '@/scripts/categories'
import { removeSymbols } from '@/scripts/common'
import createFuzzySearch from '@nozbe/microfuzz'
import { isClient, useElementSize, useMounted } from '@vueuse/core'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { WindowScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import DialogComponent from './DialogComponent.vue'

const pageContext = usePageContext()
const isMounted = useMounted()

const currentPage = ref(Number(pageContext.urlParsed.search.page) || 1)
const perPage = ref(250)

const props = withDefaults(defineProps<{
        data: ITEM[],
        getSearchText(item: ITEM): string[],
        getExactSearchText?(item: ITEM): string,
        filters?: Record<string, FilterFunctionsType>,
        sorters?: Record<string, SortFunctionsType>,
        query?: Record<string, string | string[] | number | null>,
        placeholder?: string,
        pageParam?: string,
        saveUrl?: boolean,
        itemWidth?: number,
        itemHeight?: number,
        itemGap?: number,
    }>(), {
        filters: () => {return {}},
        sorters: () => {return {}},
        query: () => {return {}},
        placeholder: 'Pony',
        itemWidth: 160,
        itemHeight: 160 * (4/3),
        itemGap: 0,
    }
)

const itemGap = computed(() => props.itemGap)
const itemWidth = computed(() => props.itemWidth + itemGap.value)
const itemHeight = computed(() => props.itemHeight + itemGap.value)

const sortDialog = useTemplateRef('sort-dialog')
const filterDialog = useTemplateRef('filter-dialog')
const scroller = useTemplateRef('scroller')
const sortMethod = ref<string>('relevance')
const reversed = ref<boolean>(props.saveUrl && 'reverse' in pageContext.urlParsed.search)
const defaultSortMethod = computed(() => {
    if (props.sorters) {
        for (let method of Object.keys(props.sorters)) {
            if (props.sorters[method].default) {
                return method
            }
        }
        if (!sortMethod.value) {
            return Object.keys(props.sorters)[0]
        }
    }
    return null
})

const selectedFilters = ref<Record<string, boolean>>({})

const _selectedSortMethod = ref<string>(sortMethod.value)
const _reversed = ref<boolean>()
const _selectedFilters = ref<Record<string, boolean>>({})

watch(
    computed(() => props.filters),
    () => {
        for (let key of Object.keys(selectedFilters.value)) {
            if (!(key in props.filters)) {
                delete selectedFilters.value[key]
            }
        }
        if (props.filters) {
            for (let key of Object.keys(props.filters)) {
                if (!(key in selectedFilters.value)) {
                    selectedFilters.value[key] = false
                }
            }
        }

        _selectedFilters.value = {}
        for (let [key, value] of Object.entries(selectedFilters.value)) {
            _selectedFilters.value[key] = value
        }
    }
)

const filters = computed(() => {
    const filters: string[] = []

    if (!props.filters) {
        return filters
    }
    
    if (!Object.values(selectedFilters.value).includes(true)) {
        for (let [filter, filterInfo] of Object.entries(props.filters)) {
            if (filterInfo.default) {
                filters.push(filter)
            }
        }
    } else {
        for (let [filter, enabled] of Object.entries(selectedFilters.value)) {
            if (enabled && filter in props.filters) {
                filters.push(filter)
            }
        }
    }

    // console.log('filters', filters)

    return filters
})

const filterOnClient = computed(() => filters.value.some(filter => props.filters[filter].client))

if (props.sorters) {
    const sortQuery = pageContext.urlParsed.search.sort
    
    if (props.saveUrl && pageContext.urlParsed.search.sort && sortQuery in props.sorters) {
        sortMethod.value = sortQuery
    } else {
        sortMethod.value = 'relevance'
    }
}

const sortFunction = computed(() => {
    return props.sorters ? props.sorters[sortMethod.value]?.check : null
})


function openSortDialog() {
    _selectedSortMethod.value = sortMethod.value
    _reversed.value = reversed.value
}

function submitSortDialog() {
    sortMethod.value = _selectedSortMethod.value
    reversed.value = _reversed.value
}

function openFilterDialog() {
    _selectedFilters.value = {}
    for (let [key, value] of Object.entries(selectedFilters.value)) {
        _selectedFilters.value[key] = value
    }
}

function submitFilterDialog() {
    for (let [key, value] of Object.entries(_selectedFilters.value)) {
        selectedFilters.value[key] = value
    }
}



const searchQuery = ref('')

if (props.saveUrl) {
    watch(
        computed(() => {return {
            searchQuery,
             sortMethod,
            selectedFilters,
            reversed,
            query: props.query,
        }}),
        () => {
            const params: Record<string, string | null> = {
                ...props.query,
                q: searchQuery.value || null,
                sort: sortMethod.value || null,
            }
    
            if (!params.q) {
                params.q = null
            }
    
            const currentFilters = Object.keys(props.filters).filter(key => selectedFilters.value[key])
            
            if (!currentFilters.length) {
                params.filter = null
            } else {
                params.filter = currentFilters.join(',')
            }
    
            if (!params.sort || sortMethod.value === 'relevance') {
                params.sort = null
            }
    
            if (reversed.value) {
                params.reverse = 'true'
            } else {
                params.reverse = null
            }
    
            history.replaceState(
                null,
                '',
                modifyUrl(
                    pageContext.urlOriginal,
                    {
                        search: params,
                    }
                ),
            )
        },
        {
            deep: true,
        }
    )
}

const items = computed(() => props.data)

function checkObject(item: ITEM, filterKey: string) {
    const filter = props.filters[filterKey]
    const mainCheck =filter.check ? filter.check(item) : true
    let excludeCheck = true
    let includeCheck = true
    if (mainCheck && filter.exclude) {
        excludeCheck = filter.exclude.every((excludeFilter) => (
            filters.value.includes(excludeFilter) ||
            (!checkObject(item, excludeFilter))
        ))
    }
    if (mainCheck && filter.include) {
        includeCheck = filter.include.every((includeFilter) => (
            filters.value.includes(includeFilter) ||
            checkObject(item, includeFilter)
        ))
    }

    return mainCheck && excludeCheck && includeCheck
}

function sortItems(items: ITEM[], func?: (a: ITEM, b: ITEM) => number) {
    if (func) {
        return [...items].sort((a,b) => (func(a,b)))
    } else {
        return [...items]
    }
}

const filteredItems = computed(() => {
    let filtered = items.value
    if (filters.value.length) {
        filtered = filtered.filter(
            gameObject => filters.value.every((key) => checkObject(gameObject, key))
        )
    }
    return filtered
})

const computedItems = computed(() => {
    let itemsToSearch = filteredItems.value
    if (defaultSortMethod.value) {
        itemsToSearch = sortItems(
            itemsToSearch,
            props.sorters[defaultSortMethod.value].check,
        )
    }

    return createFuzzySearch(itemsToSearch, {
        getText: (item: ITEM) => props.getSearchText(item).map(text => removeSymbols(text)),
        strategy: 'aggressive',
    })
})

const searchResults = computed(() => {
    
    let searchStart = performance.now()

    let results: ITEM[] = []

    const query = searchQuery.value.trim()

    if (!query) {
        results = filteredItems.value
    } else {
        if (props.getExactSearchText) {
            results = filteredItems.value.filter((item) => {
                const text = props.getExactSearchText(item)
                return text.toLocaleLowerCase() == query.toLocaleLowerCase()
            })
        }
        if (results.length == 0) {
            let items = computedItems.value(removeSymbols(query))
            if (isClient) {
                console.debug('items', items)
            }
            items = items.filter(item => item.score <= 4)
            results = items.map(item => item.item)
        }
    }
    return results
})

const sortedResults = computed(() => {
    let results = searchResults.value
    if (!searchQuery.value.trim() && sortMethod.value === 'relevance' && defaultSortMethod.value) {
        results = sortItems(results, props.sorters[defaultSortMethod.value].check)
    } else if (sortMethod.value !== 'relevance') {
        results = sortItems(results, sortFunction.value)
    }
    if (reversed.value) {
        results = [...results].reverse()
    }
    return results
})

const shownResults = computed(() => {
    let results = sortedResults.value
    
    // We no longer split by page
    // let start = (Math.max(1, currentPage.value) - 1) * perPage.value
    // results = results.slice(start, start + perPage.value)

    return results
})

const scrollerSize = useElementSize(scroller)

const columnCount = computed(() => {
    const columns = Math.floor(scrollerSize.width.value / itemWidth.value)
    return Math.max(1, Math.min(columns, shownResults.value.length))
})


if (props.saveUrl && pageContext.urlParsed.search.q) {
    searchQuery.value = pageContext.urlParsed.search.q
}

if (props.saveUrl && pageContext.urlParsed.search.filter) {
    let filterQuery = pageContext.urlParsed.search.filter.split(',')
    for (let filter of filterQuery) {
        selectedFilters.value[filter] = true
    }
}

watch(
    computed(() => pageContext.urlParsed.pathname),
    (newUrl, oldUrl) => {
        if (newUrl != oldUrl) {
            searchQuery.value = ''
            sortMethod.value = defaultSortMethod.value
            selectedFilters.value = {}
            reversed.value = false
            currentPage.value = 1
        }
    }
)

</script>

<template>
    <div class="search-section">
        <div class="search-container">
            <slot name="menu-before"></slot>
            
            <label for="search-bar">
                {{ $t('search.message.search') }}
                <input v-model="searchQuery" class="text-box" type="search" name="search-bar" id="search-bar" :placeholder="$props.placeholder" />
            </label>
            
            <button
                v-if="(props.filters && Object.keys(props.filters).length)"
                @click="filterDialog.open()"
                id="filter-button"
                class="search-option button button-blue"
            >
                <img src="@/assets/images/ui/filter.svg" alt="">
            </button>
            <button
                v-if="(props.sorters && Object.keys(props.sorters).length)"
                @click="sortDialog.open()"
                id="sort-button"
                class="button button-blue"
            >
                {{ $t('dialog.sort_by') }}
            </button>
            <slot name="menu-after"></slot>
        </div>

        <template v-if="!filterOnClient || (filterOnClient && isMounted)">
            <!-- <Paginator
                v-model="currentPage"
                :per-page="perPage"
                :total="searchResults.length"
                :max-pages="10"
                :param="props.pageParam"
            ></Paginator> -->

            <section v-if="!items.length" class="main-section empty">
                <slot name="empty"></slot>
            </section>
            <section
                ref="scroller"
                v-else-if="shownResults.length > 0"
                class="main-section search-results"
            >
                <WindowScroller
                    class="scroller"
                    :items="shownResults"
                    :item-size="itemHeight"
                    :grid-items="columnCount"
                    :item-secondary-size="itemWidth"
                    key-field="id"
                    :buffer="itemHeight * 3"
                >
                    <template #default="{ item }">
                        <div class="item" :data-key="item.id">
                            <slot name="item" :item="item">
                            </slot>
                        </div>
                    </template>
                </WindowScroller>
                <!-- <div class="item" v-for="item in shownResults" :key="item.id" :data-key="item.id"> -->
            </section>
            <section v-else class="main-section empty">
                <slot name="no-results">{{ $t('search.no_results') }}</slot>
            </section>
        
            <!-- <Paginator
                v-model="currentPage"
                :per-page="perPage"
                :total="searchResults.length"
                :max-pages="10"
                :param="props.pageParam"
            ></Paginator> -->
        </template>

        <dialog-component
            :has-close-button="true"
            ref="filter-dialog"
            :title="$t('dialog.filter')"
            @open="openFilterDialog"
            @submit="submitFilterDialog"
        >

            <div class="dialog-options">
                <label v-for="filterKey in Object.keys(props.filters)" :key="filterKey">
                    <input type="checkbox" name="filterMethod" :value="filterKey" v-model="_selectedFilters[filterKey]">
                    {{ typeof props.filters[filterKey].name === 'string' ? $t(props.filters[filterKey].name) : props.filters[filterKey].name }}
                </label>
            </div>

            <template #menu>
                <button class="button button-green" @click="filterDialog.submit()">{{ $t('button.ok') }}</button>
                <button class="button button-red" @click="filterDialog.cancel()">{{ $t('button.cancel') }}</button>
            </template>
        </dialog-component>
        
        <dialog-component
            :has-close-button="true"
            ref="sort-dialog"
            :title="$t('dialog.sort_by')"
            @open="openSortDialog"
            @submit="submitSortDialog"
        >

            <div class="dialog-options">
                <label>
                    <input v-model="_reversed" type="checkbox" name="reverse">
                    {{ $t('sorting.reverse') }}
                </label>
                <label>
                    <input type="radio" name="sortMethod" value="relevance" v-model="_selectedSortMethod">
                    {{ $t('sorting.relevance') }}
                </label>
                <label v-for="[sortKey, {name: sortName}] in Object.entries(props.sorters)" :key="sortKey">
                    <input type="radio" name="sortMethod" :value="sortKey" v-model="_selectedSortMethod">
                    {{ typeof sortName === 'string' ? $t(sortName) : sortName }}
                </label>
            </div>

            <template #menu>
                <button class="button button-green" @click="sortDialog.submit()">{{ $t('button.ok') }}</button>
                <button class="button button-red" @click="sortDialog.cancel()">{{ $t('button.cancel') }}</button>
            </template>
        </dialog-component>
    </div>
</template>

<style lang="css" scoped>

.search-section {
    display: flex;
    flex-direction: column;
}

.search-container {
    position: sticky;
    top: 0;

    background-color: var(--background-color, var(--page-background-color));
    padding-block: 0.2rem;

    text-align: center;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    align-items: center;
}

#search-bar {
    margin: 0;
}

/* search results */

.search-results {
    display: grid;
    justify-items: center;

    width: 100%;

    .scroller {
        min-width: calc(v-bind('itemWidth') * v-bind('columnCount') * 1px);
    }

    .item {
        display: grid;
        width: 100%;
        height: 100%;
        justify-items: center;
    }
}

#search-results {
    --card-size: 9rem;
    
    display: grid;
    grid-template-columns: repeat(auto-fit, var(--card-size));
    gap: 0.3rem;
    justify-items: center;
    justify-content: center;

    margin-top: 0.5rem;

}

.search-option {
    width: 2rem;
    height: 2rem;
    padding-inline: 0.2rem;
}

.search-option img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
}

.main-section {
    flex: 1;
}

.empty {
    text-align: center;
    /* display: grid;
    align-content: center;
    justify-content: center; */
    position: relative;
}

.dialog-options {
    display: flex;
    flex-direction: column;
}

/* .dialog-options > * {
    display: block;
} */
</style>
