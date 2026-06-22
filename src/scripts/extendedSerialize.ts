/**
 * Originally created by Vladislav Mamon at https://gist.github.com/norskeld/f59eb5a2ee1bde9b7047a9d4bb1af08a
 */


const enum Mark {
  Set = '@set',
  Map = '@map',
  Date = '@date'
}

type Serialized<M extends Mark, S = unknown> = [mark: M, value: S]

type Codec<T, S> = {
  serialize(value: T): Serialized<Mark, S>
  deserialize(value: S): T
}

const SetCodec: Codec<Set<unknown>, unknown[]> = {
  serialize: (value) => [Mark.Set, [...value]],
  deserialize: (values) => new Set(values)
}

const MapCodec: Codec<Map<string, unknown>, [string, unknown][]> = {
  serialize: (value) => [Mark.Map, [...value.entries()]],
  deserialize: (values) => new Map(values)
}

const DateCodec: Codec<Date, string> = {
  serialize: (value) => [Mark.Date, value.toISOString()],
  deserialize: (value) => new Date(value)
}

const isSet = (value: unknown): value is Serialized<Mark.Set, unknown[]> =>
  Array.isArray(value) && value[0] === Mark.Set

const isMap = (value: unknown): value is Serialized<Mark.Map, [string, unknown][]> =>
  Array.isArray(value) && value[0] === Mark.Map

const isDate = (value: unknown): value is Serialized<Mark.Date, string> =>
  Array.isArray(value) && value[0] === Mark.Date

export function extendedSerialize(value: unknown): string {
  return JSON.stringify(value, function (this: any, key: string, value: unknown) {
    if (value instanceof Set) return SetCodec.serialize(value)
    if (value instanceof Map) return MapCodec.serialize(value)
    if (this[key] instanceof Date) return DateCodec.serialize(this[key])

    return value
  })
}

export function extendedDeserialize<T = unknown>(value: string): T {
  return JSON.parse(value, function (this: any, key: string, value: unknown) {
    const raw = this[key] as unknown

    if (isSet(raw)) return SetCodec.deserialize(raw[1])
    if (isMap(raw)) return MapCodec.deserialize(raw[1])
    if (isDate(raw)) return DateCodec.deserialize(raw[1])

    return value
  }) as T
}
