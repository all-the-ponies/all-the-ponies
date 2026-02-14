<script setup lang="ts">
import api from '@/scripts/api'
import type { GameObjectId } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CurrencyImage from '../CurrencyImage.vue'
import { valueExists } from '@/scripts/common'
import gameData from '@/scripts/gameData'
import Table from '../table/Table.vue'
import TableBody from '../table/TableBody.vue'
import TableRow from '../table/TableRow.vue'
import TableHeader from '../table/TableHeader.vue'
import TableHeaderCell from '../table/TableHeaderCell.vue'
import TableCell from '../table/TableCell.vue'

const { t, d } = useI18n()

const props = defineProps<{
    object: GameObjectId,
}>()

const gameObject = computed(() => gameData.getObject(props.object))

const priceHistory = computedAsync(async () => {
    if (!gameObject.value?.id) {
        return null
    }
    const data = await api.getPriceHistory(gameObject.value.id)
    console.log('data', data)
    if ('detail' in data) {
        return null
    }
    return data
}, null, {lazy: true})

function formatDateRange(start: string, end: string) {
    let startDate = new Date(`${start}T07:00z`)
    let endDate = new Date(`${end}T07:00z`)

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
    <ClientOnly>
        <div v-if="priceHistory">
            <Table class="price-table">
                <TableBody>
                    <TableHeader>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Price</TableHeaderCell>
                        <TableHeaderCell>Royal</TableHeaderCell>
                        <TableHeaderCell>Tokens</TableHeaderCell>
                    </TableHeader>
                    <TableRow v-for="entry in priceHistory.price_history">
                        <TableCell>
                            {{ formatDateRange(entry.start_date, entry.end_date) }}
                        </TableCell>
                        <TableCell>
                            <CurrencyImage :object="entry.price.sale?.currency ?? entry.price.base?.currency">
                                {{ entry.price.sale?.price ?? entry.price.base?.price }}
                            </CurrencyImage>
                            <span v-if="valueExists(entry.price.sale.price)">
                                ({{
                                    $n(
                                        1 - entry.price.sale.price / entry.price.base.price,
                                        { style: 'percent' },
                                    )
                                }}
                                {{ $t('store.message.percent_off') }})
                            </span>
                        </TableCell>
                        <TableCell>
                            <template v-if="valueExists(entry.price.royal?.price)">
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
                        <TableCell>
                            <template v-if="gameObject.price?.token || entry.tags?.includes('pvsar1') || entry.tags?.includes('pvsar2')">
                                <CurrencyImage :object="
                                    entry.tags?.includes('pvsar1') ?'Token_Event_Rare' :
                                    entry.tags?.includes('pvsar2') ? 'Token_Event_Common' :
                                    gameObject.price?.token
                                ">
                                    {{ entry.price.base.tokens }}
                                </CurrencyImage>
                            </template>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        <div v-else></div>
    </ClientOnly>
</template>

<style lang="css" scoped>
.price-table {
    font-size: 1rem;
}
</style>
