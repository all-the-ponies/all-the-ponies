import { toValue, type MaybeRefOrGetter } from "vue";
import { useRem } from "./useRem";

export function useGameCardSize(baseSize: MaybeRefOrGetter<number> = 10) {
    const width = useRem(toValue(baseSize))
    const height = useRem(toValue(baseSize) * (4/3) + .8)

    return { width, height }
}
