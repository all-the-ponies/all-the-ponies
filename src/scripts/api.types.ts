import type { TDateISO } from "@/types/date";
import type { GameObjectId } from "@/types/gameDataTypes";

export type PlayerStatName = 'pony' | 'pony_alt' | 'shop' | 'gem_shop' | 'collection' | 'costume' | 'hots'

export interface SaveData {
    version: number,
    player_info: {
        join_date: TDateISO,
        total_playtime: number,
        level: number,
        xp: number,
        required_xp: number,
        currency: {
            gems: number,
            bits: number,
        },
        player_card: {
            name: {
                left: string,
                right: string,
            },
            display_stats: {
                left: PlayerStatName,
                right: PlayerStatName,
            },
            avatar: string,
            avatar_frame: string,
            background: string,
            background_frame: string,
            cutie_mark: string,
        },
    },
    stats: {
        wh_collections: number,
    },
    inventory: {
        ponies: Record<string, {
            id: GameObjectId,
            level: 0 | 1 | 2 | 3 | 4 | 5 | null,
            next_minigame: number | null,
            notWelcomed?: boolean,
        }>,
        shops: GameObjectId[],
        costume_parts: string[],
        avatars: string[],
        avatar_frames: string[],
        backgrounds: string[],
        background_frames: string[],
        cutie_marks: string[],
        critters: Record<GameObjectId, number>,
    },
}

export interface MazeProgress {
    active: boolean,
    position: {
        x: number,
        y: number,
    },
    energy: number,
    last_energy_time: number,
    currency: number,
    upgrade_tokens: number,
    level: number,
    xp: number,
    helpers: {
        id: string,
        fights: number,
    }[],
    map: {
        blocks: {
            id: string,
            x: number,
            y: number,
            uncovered: boolean,
        }[],
    }
}



export interface ShopPrice {
    price: number | null,
    currency: GameObjectId | null,
    tokens: number | null,
}

export interface ShopEntry {
    id: GameObjectId,
    in_shop: boolean,
    hidden: boolean,
    price: {
        base: ShopPrice,
        sale: ShopPrice,
        royal: ShopPrice,
    },
    tags: string[],
}

export interface PriceHistoryEntry {
    start_date: string,
    end_date: string,
    hidden: boolean,
    price: {
        base: ShopPrice,
        sale: ShopPrice,
        royal: ShopPrice,
    },
    tags: string[],
}

export interface PriceHistoryType {
    id: GameObjectId,
    price_history: PriceHistoryEntry[],
}


export interface EventReward {
    rank_interval: number[],
    gifts: {
        name: string,
        value: number,
    }[]
}

export interface LTSEvent {
    id: string,
    start_date: string,
    end_date: string,
    construction: string | null,
    rewards: EventReward[],
}

export interface LTSEvents {
    current: LTSEvent,
    next: LTSEvent,
}
