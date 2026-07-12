import { toValue, type MaybeRefOrGetter } from "vue";
import { useRem } from "./useRem";

export function useCollectionCardSize(baseSize: MaybeRefOrGetter<number> = 10) {
    const width = useRem(toValue(baseSize) * (16/9))
    const height = useRem(toValue(baseSize))

    return { width, height }
}
