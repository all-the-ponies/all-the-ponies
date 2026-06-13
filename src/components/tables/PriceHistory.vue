<script setup lang="ts">
import { type PriceHistoryEntry } from '@/scripts/api.types'
import type { GameObjectId } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CurrencyImage from '../CurrencyImage.vue'
import { notNullIsh } from '@/scripts/common'
import gameData from '@/scripts/gameData'
import Table from '../table/Table.vue'
import TableBody from '../table/TableBody.vue'
import TableRow from '../table/TableRow.vue'
import TableHeader from '../table/TableHeader.vue'
import TableHeaderCell from '../table/TableHeaderCell.vue'
import TableCell from '../table/TableCell.vue'
import TableContainer from '../table/TableContainer.vue'

const { t, d } = useI18n()

const props = defineProps<{
    object: GameObjectId,
    priceHistory: PriceHistoryEntry[] | null,
}>()

const priceHistory = computed(() => props.priceHistory)
const gameObject = computed(() => gameData.getObject(props.object))

// const priceHistory = computedAsync(async () => {
//     if (!gameObject.value?.id) {
//         return null
//     }
//     console.log('loading data')
//     const data = await api.getPriceHistory(gameObject.value.id)
//     console.log('data', data)
//     if ('detail' in data) {
//         return null
//     }
//     return data
// }, null, {lazy: false})

const shownColumns = computed(() => {
    const columns = {
        base: false,
        royal: false,
        tokens: false,
    }

    let basePrice = priceHistory.value[0]?.price?.base?.price

    if (priceHistory.value) {
        for (let entry of priceHistory?.value) {
            if (entry.hidden) {
                continue
            }

            if (notNullIsh(entry.price.base.tokens)) {
                columns.tokens = true
            }

            if (notNullIsh(entry.price.royal.price)) {
                console.log('show royal', entry.price.royal.price)
                columns.royal = true
            }

            if (entry.price.base.price != basePrice) {
                columns.base = true
            }
        }
    }

    return columns
})

function formatDateRange(start: string, end: string) {
    let startDate = new Date(`${start}T07:00Z`)
    let endDate = new Date(`${end}T07:00Z`)

    const today = new Date()

    if (startDate.toDateString() === today.toDateString()) {
        return t('common.date.current')
    }

    const formatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    } satisfies Intl.DateTimeFormatOptions

    let formattedStart = d(startDate, formatOptions)
    let formattedEnd = d(endDate, formatOptions)

    if (endDate >= today) {
        formattedEnd = t('common.date.current')
    }

    return t('common.date.range', {
        start: formattedStart,
        end: formattedEnd,
    })
}

</script>

<template>
    <div>
        <TableContainer>
            <Table class="price-table">
                <TableBody>
                    <TableHeader>
                        <TableHeaderCell>{{ $t('price_history.header.date') }}</TableHeaderCell>
                        <TableHeaderCell>{{ $t('price_history.header.price') }}</TableHeaderCell>
                        <TableHeaderCell v-if="shownColumns.royal">{{ $t('price_history.header.royal') }}</TableHeaderCell>
                        <TableHeaderCell v-if="shownColumns.tokens">{{ $t('price_history.header.tokens') }}</TableHeaderCell>
                    </TableHeader>
                    <template v-if="priceHistory">
                        <TableRow v-for="entry in priceHistory">
                            <TableCell>
                                {{ formatDateRange(entry.start_date, entry.end_date) }}
                            </TableCell>
                            <TableCell v-if="entry.tags.includes('whthot')">
                                {{ $t('price_history.message.whats_hot') }}
                            </TableCell>
                            <TableCell v-else>
                                <CurrencyImage :object="entry.price.sale?.currency ?? entry.price.base?.currency">
                                    {{ entry.price.sale?.price ?? entry.price.base?.price }}
                                </CurrencyImage>
                                <span v-if="notNullIsh(entry.price.sale.price)">
                                    ({{
                                        $n(
                                            1 - entry.price.sale.price / entry.price.base.price,
                                            { style: 'percent' },
                                        )
                                    }}
                                    {{ $t('store.message.percent_off') }})
                                </span>
                            </TableCell>
                            <TableCell v-if="shownColumns.royal">
                                <template v-if="notNullIsh(entry.price.royal?.price)">
                                    <CurrencyImage :object="entry.price.royal?.currency">
                                        {{ entry.price.royal?.price }}
                                    </CurrencyImage>
                                    ({{
                                        $n(
                                            1 - entry.price.royal.price / entry.price.base.price,
                                            { style: 'percent' },
                                        )
                                    }}
                                    {{ $t('store.message.percent_off') }})
                                </template>
                            </TableCell>
                            <TableCell v-if="shownColumns.tokens">
                                <template v-if="gameObject.category !== 'costume_part' && gameObject.price?.token || entry.tags?.includes('pvsar1') || entry.tags?.includes('pvsar2')">
                                    <CurrencyImage :object="
                                        entry.tags?.includes('pvsar1') ?'Token_Event_Rare' :
                                        entry.tags?.includes('pvsar2') ? 'Token_Event_Common' :
                                        gameObject.category !== 'costume_part' ? gameObject.price?.token :
                                        null
                                    ">
                                        {{ entry.price.base.tokens }}
                                    </CurrencyImage>
                                </template>
                            </TableCell>
                        </TableRow>
                    </template>
                </TableBody>
            </Table>
        </TableContainer>
    </div>
</template>

<style lang="css" scoped>
.price-table {
    font-size: 1rem;
    max-width: 30rem;
    min-width: max-content;
    width: 100%;
}
</style>
