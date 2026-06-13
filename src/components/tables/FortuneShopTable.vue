<script setup lang="ts">
import type { FortuneShopItem } from '@/types/gameDataTypes';
import { computed } from 'vue';
import CurrencyImage from '../CurrencyImage.vue';
import Table from '../table/Table.vue';
import TableBody from '../table/TableBody.vue';
import TableCell from '../table/TableCell.vue';
import TableContainer from '../table/TableContainer.vue';
import TableHeader from '../table/TableHeader.vue';
import TableHeaderCell from '../table/TableHeaderCell.vue';
import TableRow from '../table/TableRow.vue';


const props = defineProps<{
    prices: FortuneShopItem['prices'],
}>()


const prices = computed(() => props.prices)
const basePrice = computed(() => prices.value.regular.regular)

const priceConfig = [
    {
        prop: 'regular',
        string: 'fortune_shop.price_rarities.regular',
    },
    {
        prop: 'discount',
        string: 'fortune_shop.price_rarities.discount',
    },
    {
        prop: 'super',
        string: 'fortune_shop.price_rarities.super',
    },
    {
        prop: 'ultra',
        string: 'fortune_shop.price_rarities.ultra',
    },
]

</script>

<template>
<div>
    <TableContainer>
        <Table class="fortune-shop-prices">
            <TableBody>
                <!-- <TableHeader>
                    <TableHeaderCell></TableHeaderCell>
                    <TableHeaderCell>{{ $t('fortune_shop.price_rarities.regular') }}</TableHeaderCell>
                    <TableHeaderCell>{{ $t('fortune_shop.price_rarities.discount') }}</TableHeaderCell>
                    <TableHeaderCell>{{ $t('fortune_shop.price_rarities.super') }}</TableHeaderCell>
                    <TableHeaderCell>{{ $t('fortune_shop.price_rarities.ultra') }}</TableHeaderCell>
                </TableHeader>
                <TableRow>
                    <TableHeaderCell>{{ $t('fortune_shop.messages.regular') }}</TableHeaderCell>
                    <TableCell
                        v-for="price in Object.values(prices.regular)"
                    >
                        <CurrencyImage object="Gems">
                            {{ price }}
                        </CurrencyImage>
                        <span v-if="price != basePrice">
                            ({{
                                $n(
                                    1 - price / basePrice,
                                    { style: 'percent' },
                                )
                            }}
                            {{ $t('store.message.percent_off') }})
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableHeaderCell>{{ $t('fortune_shop.messages.royal') }}</TableHeaderCell>
                    <TableCell
                        v-for="price in Object.values(prices.royal)"
                    >
                        <CurrencyImage object="Gems">
                            {{ price }}
                        </CurrencyImage>
                        <span v-if="price != basePrice">
                            ({{
                                $n(
                                    1 - price / basePrice,
                                    { style: 'percent' },
                                )
                            }}
                            {{ $t('store.message.percent_off') }})
                        </span>
                    </TableCell>
                </TableRow> -->

                <TableHeader>
                    <TableHeaderCell></TableHeaderCell>
                    <TableHeaderCell>{{ $t('fortune_shop.messages.regular') }}</TableHeaderCell>
                    <TableHeaderCell>{{ $t('fortune_shop.messages.royal') }}</TableHeaderCell>
                </TableHeader>
                <TableRow
                    v-for="info in priceConfig"
                >
                    <TableHeaderCell>{{ $t(info.string) }}</TableHeaderCell>
                    <TableCell>
                        <CurrencyImage object="Gems">
                            {{ prices.regular[info.prop] }}
                        </CurrencyImage>
                        <span v-if="prices.regular[info.prop] != basePrice">
                            ({{
                                $n(
                                    1 - prices.regular[info.prop] / basePrice,
                                    { style: 'percent' },
                                )
                            }}
                            {{ $t('store.message.percent_off') }})
                        </span>
                    </TableCell>
                    <TableCell>
                        <CurrencyImage object="Gems">
                            {{ prices.royal[info.prop] }}
                        </CurrencyImage>
                        <span v-if="prices.royal[info.prop] != basePrice">
                            ({{
                                $n(
                                    1 - prices.royal[info.prop] / basePrice,
                                    { style: 'percent' },
                                )
                            }}
                            {{ $t('store.message.percent_off') }})
                        </span>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </TableContainer>
</div>
</template>

<style lang="css" scoped>

</style>
