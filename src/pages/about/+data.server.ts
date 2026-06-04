import type { PageContextServer } from "vike/types"
import { env } from 'cloudflare:workers'
import ky from "ky"

export type Data = {}

export async function data(pageContext: PageContextServer) {
    const url = new URL('https://hosted.weblate.org/api/components/all-the-ponies/strings/credits/')

    url.searchParams.set('start', '2026-06-01T00:00:00.000Z')
    url.searchParams.set('end', new Date(Number(__BUILD_DATE__)).toISOString())

    const credits = await ky(url, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Token ${env.WEBLATE_API_TOKEN}`,
        }
    }).json()

    return { credits }
}
