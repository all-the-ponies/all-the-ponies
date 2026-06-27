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
        const languages = await ky<Record<'name' | 'code', string>[]>('https://hosted.weblate.org/api/projects/all-the-ponies/languages/', {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Token ${env.WEBLATE_API_TOKEN}`,
            }
        }).json()
    
        const languageMap = {}
    
        console.log('languages', languages)
    
        for (let langData of languages) {
            languageMap[langData.name] = langData.code
        }
    
        console.log('languageMap', languageMap)
    
        
        const url = new URL('https://hosted.weblate.org/api/components/all-the-ponies/strings/credits/')
    
        url.searchParams.set('start', '2026-06-01T00:00:00.000Z')
        url.searchParams.set('end', new Date(Number(__BUILD_DATE__)).toISOString())
    
        const rawCredits = await ky<Record<string, WeblateUser[]>[]>(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Token ${env.WEBLATE_API_TOKEN}`,
            }
        }).json()
    
        console.log('rawCredits', rawCredits)
    
        const credits: Record<string, Translator> = {}
    
        for (let creditData of rawCredits) {
            for (let [language, users] of Object.entries(creditData)) {
                let code = languageMap[language]
                for (let user of users) {
                    // Remove myself from translation credits
                    if (user.username === 'ego-lay-atman-bay') {
                        continue
                    }
    
                    if (user.username in credits) {
                        if (!credits[user.username].languages.includes(code)) {
                            credits[user.username].languages.push(code)
                        }
                    } else {
                        credits[user.username] = {
                            username: user.username,
                            full_name: user.full_name,
                            source: 'weblate',
                            languages: [code],
                        }
                    }
                }
            }
        }
    
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
    
        return { credits } satisfies Data
    } catch (error) {
        return {error: String(error), credits: null}
    }
}
