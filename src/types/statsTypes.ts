export interface PonyStats {
    total: number,
    unique: number,
    regular: number,
    changelings: number,
    gemCollectors: number,
    bitCollectors: number,
    tokenCollectors: number,
    groups: number,
    stars: number,
}

export interface HouseStats {
    total: number,
}

export interface ShopStats {
    total: number,
    mainTotal: number,
    bits: number,
    gems: number,
    critters: number,
    feeds: number,
    maze: number,
    others: number,
}

export interface CostumeStats {
    total: number,
}

export interface CollectionStats {
    total: number,
}

export interface Stats {
    ponies: PonyStats,
    houses: HouseStats,
    shops: ShopStats,
    costumes: CostumeStats,
    collections: CollectionStats,
}
