import type { Ref } from "vue";

export interface FilterFunctionsType<T = unknown> {
    name?: string | Ref,
    // type: 'checkbox' | 'radio' | 'text' | 'number',
    check?(gameObject: T): boolean,
    default?: boolean,
    group?: string,
    include?: string[],
    exclude?: string[],
    hidden?: boolean,
    client?: boolean,
}

export interface SortFunctionsType<T = unknown> {
    name?: string | Ref,
    check(a: T, b: T): number,
    default?: boolean,
    hidden?: boolean,
}
