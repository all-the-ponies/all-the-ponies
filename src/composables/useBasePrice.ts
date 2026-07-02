import type { PriceHistoryEntry, PriceHistoryType } from "@/scripts/api.types";
import type { GameObject } from "@/types/gameDataTypes";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

export function useBasePrice(
    gameObject: MaybeRefOrGetter<GameObject>,
    priceHistory: MaybeRefOrGetter<PriceHistoryEntry[]>,
) {
    return computed(() => {
        const obj = toValue(gameObject)
        const prices = toValue(priceHistory)

        if (!('price' in obj)) {
            return
        }

        const result = {
            token: obj.price?.token,
            tokens: null,
            currency: obj.price?.base.currency,
            price: obj.price?.base.amount,
            dailyGoals: obj.price?.daily_goals,
        }
        if (['Token_Event_Common', 'Token_Event_Rare'].includes(result.token)) {
            result.token = null
        }
        if (prices.length) {
            result.currency = prices[0].price.base.currency
            result.price = prices[0].price.base.price
            result.tokens = prices[0].price.base.tokens
        }
        if (result.currency == 'Lotto') {
            result.currency = null // hide "Lotto" prices
        }
        return result
    })
}
