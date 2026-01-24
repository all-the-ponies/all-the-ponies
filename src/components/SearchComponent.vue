<script lang="tsx" setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import ObjectCard from './ObjectCard.vue'
import gameData from '@/scripts/gameData'
import { language } from '@/globals'
import Paginator from './Paginator.vue'
import DialogComponent from './DialogComponent.vue'
import type { GameObject, GameObjectId } from '@/types/gameDataTypes'
import type { FilterFunctionsType, SortFunctionsType } from '@/scripts/categories'
import type { JSX } from 'vue/jsx-runtime'
import { usePageContext } from 'vike-vue/usePageContext'
import { modifyUrl } from 'vike/modifyUrl'
// import { useI18n } from 'vue-i18n'
// 
// const { t } = useI18n()

const pageContext = usePageContext()

const currentPage = ref(Number(pageContext.urlParsed.search.page) || 1)
const perPage = ref(300)

const props = withDefaults(defineProps<{
        objects: (GameObjectId | GameObject)[],
        filters?: Record<string, FilterFunctionsType>,
        sorters?: Record<string, SortFunctionsType>,
        query?: Record<string, string | string[] | number | null>,
        placeholder?: string,
        showPrices?: boolean,
        infoGetter? (gameObject: GameObject): string | JSX.Element,
    }>(), {
        filters: () => {return {}},
        sorters: () => {return {}},
        query: () => {return {}},
        placeholder: 'Pony',
        infoGetter: null,
    }
)

const sortDialog = useTemplateRef('sort-dialog')
const filterDialog = useTemplateRef('filter-dialog')
const sortMethod = ref<string>()
const reversed = ref<boolean>('reverse' in pageContext.urlParsed.search)
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
    const filters = []

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

if (props.sorters) {
    const sortQuery = pageContext.urlParsed.search.sort
    
    if (pageContext.urlParsed.search.sort && sortQuery in props.sorters) {
        sortMethod.value = sortQuery
    } else {
        sortMethod.value = defaultSortMethod.value
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
            delete params.q
        }

        const currentFilters = Object.keys(props.filters).filter(key => selectedFilters.value[key])
        
        if (!currentFilters.length) {
            delete params.filter
        } else {
            params.filter = currentFilters.join(',')
        }

        if (!params.sort || sortMethod.value === defaultSortMethod.value) {
            delete params.sort
        }

        if (reversed.value) {
            params.reverse = null
        } else if ('reverse' in params) {
            delete params.reverse
        }

        history.replaceState(
            null,
            '',
            modifyUrl(
                pageContext.urlPathname,
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

const objects = computed(() => props.objects.map((obj) => gameData.getObject(obj)))

const searchResults = computed(() => {
    let results = gameData.searchName(searchQuery.value, objects.value, language.value.key)
    // let filterFunctions = filters.filter(key => selectedFilters[key])
    if (filters.value.length) {
        results = results.filter(
            gameObject => filters.value.some(key => props.filters[key].check(gameObject))
        )
    }
    if (sortFunction.value) {
        results.sort((a,b) => ((+!reversed.value * 2) - 1) * sortFunction.value(a,b))
    }
    return results
})

const shownResults = computed(() => {
    const results: GameObject[] = []

    let start = (Math.max(1, currentPage.value) - 1) * perPage.value
    for (let i = start; i < Math.min(start + perPage.value, searchResults.value.length); i++) {
        results.push(searchResults.value[i])
    }

    // console.log('results', results)
    // console.log('loop', start, Math.min(start + perPage.value, searchResults.value.length))

    return results
})

if (pageContext.urlParsed.search.q) {
    searchQuery.value = pageContext.urlParsed.search.q
}

if (pageContext.urlParsed.search.filter) {
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

function getInfo(gameObject: GameObject): JSX.Element {
    if (props.infoGetter === null) {
        return
    }
    const info = props.infoGetter(gameObject)

    if (typeof info === 'string') {
        return <span>{info}</span>
    }

    return info
}

</script>

<template>
    <div id="search-section">
        <div class="search-container">
            <slot name="menu-before"></slot>
            
            <label for="search-bar">
                Search
                <input v-model="searchQuery" class="text-box" type="search" name="search-bar" id="search-bar" :placeholder="$props.placeholder" />
            </label>
            
            <button @click="filterDialog.open()" id="filter-button" class="search-option button button-blue">
                <!-- Filter -->
                <img src="@/assets/images/ui/filter.svg" alt="">
            </button>
            <button @click="sortDialog.open()" id="sort-button" class="button button-blue">
                {{ $t('dialog.sort_by') }}
            </button>
            <slot name="menu-after"></slot>
        </div>

        <Paginator v-model="currentPage" :per-page="perPage" :total="searchResults.length" :max-pages="10" param="page"></Paginator>

        <section id="search-results">
            <template v-if="objects.length > 0">
                <ObjectCard
                    v-for="object in shownResults.values()"
                    :object="object"
                    :key="`object-${object.id}`"
                    :show-price="props.showPrices"
                >
                    <template v-if="props.infoGetter" #info>
                        <component :is="getInfo(object)"></component>
                    </template>
                </ObjectCard>
            </template>
            <slot v-else name="empty"></slot>
            
        </section>
        
        <Paginator v-model="currentPage" :per-page="perPage" :total="searchResults.length" :max-pages="10" param="page"></Paginator>

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

.search-container {
    position: sticky;
    top: 0;

    background-color: var(--page-background-color);
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

.dialog-options {
    display: flex;
    flex-direction: column;
}

/* .dialog-options > * {
    display: block;
} */
</style>
