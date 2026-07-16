import { env } from 'cloudflare:workers'
import ky from "ky"
import type { PageContextServer } from "vike/types"

export type Data = {
    credits: Record<string, Translator>,
    error?: string,
}

interface WeblateUser {
    email: string,
    username: string,
    full_name: string,
    change_count: string,
    date_joined: string,
}

export interface Translator {
    username: string,
    full_name: string,
    source: 'weblate' | 'github',
    languages: string[],
}

export async function data(pageContext: PageContextServer): Promise<Data> {
    try {
        const credits = await env.ALL_THE_PONIES_KV.get<Record<string, Translator>>('translation_credits', 'json')

        if (credits) {
            const extras: Translator[] = [
                {
                    username: 'Pamcezya',
                    full_name: 'Pamcezya',
                    source: 'github',
                    languages: ['tr'],
                },
                {
                    username: 'double_dove',
                    full_name: 'Double Dove',
                    source: 'github',
                    languages: ['zh'],
                },
                {
                    username: 'Hurmeow',
                    full_name: 'Hurmeow',
                    source: 'github',
                    languages: ['ru'],
                },
            ]
        
            for (let user of extras) {
                if (!(user.username in credits)) {
                    credits[user.username] = user
                }
            }
        }
    
        return { credits }
    } catch (error) {
        console.error(error)
        return {error: String(error), credits: null}
    }
}
