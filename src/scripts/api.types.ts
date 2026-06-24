import type { TDateISO } from "@/types/date";
import type { GameObjectId } from "@/types/gameDataTypes";

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
                left: string,
                right: string,
            },
            avatar: string,
            avatar_frame: string,
            background: string,
            background_frame: string,
            cutie_mark: string,
        },
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
