<script setup lang="ts">
import DialogComponent from '@/components/DialogComponent.vue'
import ExportDialogBody from '@/components/inventory/dialogs/ExportDialog.vue'
import Link from '@/components/Link.vue'
import ObjectCard from '@/components/ObjectCard.vue'
import SearchComponent from '@/components/SearchComponent.vue'
import { useGameCardSize } from '@/composables/useGameCardSize'
import { useRem } from '@/composables/useRem'
import { language } from '@/globals'
import { CATEGORIES, FilterFunctions, SortFunctions } from '@/scripts/categories'
import { getNames, getObject } from '@/scripts/gameData'
import saveStats from '@/scripts/stats'
import { useSaveStore } from '@/stores/saveManager'
import type { CategoryName } from '@/types/gameDataTypes'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { Config } from 'vike-vue/Config'
import { usePageContext } from 'vike-vue/usePageContext'
import { computed, ref, useTemplateRef, watch } from 'vue'

const saveStore = useSaveStore()

const pageContext = usePageContext()

const importDialog = useTemplateRef('import-dialog')
const importDisabled = ref<boolean>(false)
const exportDialog = useTemplateRef('export-dialog')

const category = ref<CategoryName>((pageContext.urlParsed.search.category) as CategoryName || 'pony')
const friendCode = ref<string>(saveStore.playerInfo.friendCode)
const errorMessage = ref<string>()

if (!(category.value in CATEGORIES)) {
    category.value = 'pony'
}

const query = ref<Record<string, string | null>>({})
if (category.value !== 'pony') {
  query.value.category = category.value
}


watch(
    category,
    () => {
        query.value.category = category.value

        if (!query.value.category || query.value.category === 'pony') {
            delete query.value.category
        }
    }
)


const gameObjects = computed(() => {
    switch (category.value) {
        case 'pony':
            return Object.keys(saveStore.ponies)
        case 'shop':
            return Object.keys(saveStore.shops)
        case 'house':
            return [...saveStore.houses]
    }
})


const sortFunctions = computed(() => {
    let functions = {
        ...SortFunctions.common
    }

    if (category.value in SortFunctions) {
        functions = {
            ...functions,
            ...SortFunctions[category.value],
        }
    }

    return functions
})

const filterFunctions = computed(() => {
    let functions = {
        ...FilterFunctions.common
    }

    if (category.value in FilterFunctions) {
        functions = {
            ...functions,
            ...FilterFunctions[category.value],
        }

        if (['pony', 'shop'].includes(category.value) && 'notOwned' in functions) {
            delete functions.notOwned
        }
    }

    return functions
})

watch(
    friendCode,
    () => errorMessage.value = ''
)

async function importFriendCode() {
    errorMessage.value = ''
    if (!friendCode.value) {
        return
    }
    importDisabled.value = true
    try {
        await saveStore.loadFromCloud(friendCode.value)
        importDialog.value.close()
        friendCode.value = saveStore.playerInfo.friendCode
    } catch (error) {
        console.error(error)
        errorMessage.value = error
    }

    importDisabled.value = false
}

const cardSize = 9
const { width: itemWidth, height: itemHeight } = useGameCardSize(cardSize)
const itemGap = useRem(.3)

</script>

<template>
    <Config :title="`${$t('inventory.title')} | ${$t(CATEGORIES[category].string, 2)}`"></Config>

    <div>
        <h1>{{ $t('inventory.title') }}</h1>

        <section>
            <ul class="stats">
                <ClientOnly>
                    <li>
                        {{
                            $t('inventory.stats.ponies', 2, {
                                named: {
                                    count: $n(saveStats.ponies.unique,)
                                },
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.transformable', 2, {
                                named: {
                                    count: $n(saveStats.ponies.changelings)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.stars', 2, {
                                named: {
                                    count: $n(saveStats.ponies.stars)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.houses', 2, {
                                named: {
                                    count: $n(saveStats.houses.total)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.shops', 2, {
                                named: {
                                    count: $n(saveStats.shops.bits + saveStats.shops.others)
                                }
                            })
                        }}
                    </li>
                    <li>
                        {{
                            $t('inventory.stats.gem_shops', 2, {
                                named: {
                                    count: $n(saveStats.shops.gems)
                                }
                            })
                        }}
                    </li>
                </ClientOnly>
            </ul>
            <button @click="importDialog.open()" class="button button-blue">{{ $t('common.import') }}</button>
            <button @click="exportDialog.open()" class="button button-blue">{{ $t('common.export') }}</button>
        </section>

        <section>
            <ClientOnly>
                <SearchComponent
                    :data="gameObjects.map(objectId => getObject(objectId, category))"
                    :get-search-text="getNames"
                    :filters="filterFunctions"
                    :sorters="sortFunctions"
                    :query="query"
                    :placeholder="$t(CATEGORIES[category].string)"
                    page-param="page"
                    save-url
                    :item-width="itemWidth"
                    :item-height="itemHeight"
                    :item-gap="itemGap"
                >
                    <template #item="{ item }">
                        <ObjectCard
                            class="item-card"
                            :object="item"
                            is-link
                            hasButtons
                        >
                        </ObjectCard>
                    </template>
                    <template #menu-before>
                        <select v-model="category" class="dropdown" name="category">
                            <option value="pony">{{ $t('game_object.pony.pony', 2) }}</option>
                            <option value="house">{{ $t('game_object.house.house', 2) }}</option>
                            <option value="shop">{{ $t('game_object.shop.shop', 2) }}</option>
                        </select>
                    </template>
                    <template #empty>
                        <i18n-t keypath="inventory.message.add_more" tag="p">
                            <template #category>
                                <Link
                                    class="link"
                                    :href="`/${CATEGORIES[category === 'house' ? 'ponies' : category].plural || category === 'house' ? 'ponies' : category}/`"
                                >
                                    {{ $t(CATEGORIES[category === 'house' ? 'ponies' : category ].string, 2).toLocaleLowerCase() }}
                                </Link>
                            </template>
                        </i18n-t>
                    </template>
                </SearchComponent>
            </ClientOnly>
        </section>

        <DialogComponent
            ref="import-dialog"
            :title="$t('common.import')"
            has-close-button
        >

            <label>
                {{ $t('player_info.friend_code') }}
                <input
                    :disabled="importDisabled"
                    v-model="friendCode"
                    class="friend-code-input text-box"
                    type="text"
                    :placeholder="$t('player_info.friend_code')"
                    @keydown="(e) => {if (e.key === 'Enter') importFriendCode()}"
                    spellcheck="false"
                >
            </label>

            <div class="error-message">{{ errorMessage }}</div>
            
            <template #menu>
                <button :disabled="importDisabled" @click="importFriendCode()" class="button button-blue">{{ $t('common.import') }}</button>
            </template>
        </DialogComponent>
        
        <ExportDialogBody
            ref="export-dialog"
        ></ExportDialogBody>
        <!-- <DialogComponent
            ref="export-dialog"
            :title="$t('common.export')"
            has-close-button
        >

            
            <template #menu>
                <button :disabled="importDisabled" @click="importFriendCode()" class="button button-blue">{{ $t('common.import') }}</button>
            </template>
        </DialogComponent> -->
    </div>
</template>

<style lang="css" scoped>
.stats li {
    list-style: none;
}

.friend-code-input {
    max-width: 12ch;
}

.error-message {
    color: var(--red);
}

.item-card {
    --card-size: calc(v-bind('cardSize') * 1rem);
}
</style>
