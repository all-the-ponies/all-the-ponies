<script setup lang="ts">
import api from '@/scripts/api'
import type { GameObjectId } from '@/types/gameDataTypes'
import { computedAsync } from '@vueuse/core'
import { ClientOnly } from 'vike-vue/ClientOnly'
import { computed, watch } from 'vue'
import moment from 'moment'
import { language } from '@/globals'
import { formatDateRange } from '@/scripts/timeFunctions'
import { useI18n } from 'vue-i18n'
import CurrencyImage from '../CurrencyImage.vue'
import { valueExists } from '@/scripts/common'
import gameData from '@/scripts/gameData'

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

function formatDate(start: string, end: string) {
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
            <table>
                <tbody>
                    <tr>
                        <th>Date</th>
                        <th>Price</th>
                        <th>Royal</th>
                        <th>Tokens</th>
                    </tr>
                    <tr v-for="entry in priceHistory.price_history">
                        <td>
                            {{ formatDate(entry.start_date, entry.end_date) }}
                        </td>
                        <td>
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
                        </td>
                        <td>
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
                        </td>
                        <td>
                            <template v-if="gameObject.price?.token || entry.tags?.includes('pvsar1') || entry.tags?.includes('pvsar2')">
                                <CurrencyImage :object="
                                    entry.tags?.includes('pvsar1') ?'Token_Event_Rare' :
                                    entry.tags?.includes('pvsar2') ? 'Token_Event_Common' :
                                    gameObject.price?.token
                                ">
                                    {{ entry.price.base.tokens }}
                                </CurrencyImage>
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else></div>
    </ClientOnly>
</template>

<style lang="css" scoped>

</style>
