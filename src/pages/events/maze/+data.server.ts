import api from "@/scripts/api";
import type { LTSEvent } from "@/scripts/api.types";
import { getMazeData } from "@/scripts/gameData";
import { env } from "cloudflare:workers";
import type { PageContext } from "vike/types";

export interface Data {
    mazeActive: boolean,
    eventInfo: LTSEvent | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const mazeData = getMazeData()
    
    const currentEvents = await api.getLTSEvents()
    let eventInfo = null
    let mazeActive = false

    if (await env.ALL_THE_PONIES_KV.get('enable_maze', 'text') == 'true') {
        mazeActive = true
    } else {
        if (currentEvents.current?.id.toLowerCase() == mazeData.id.toLowerCase()) {
            mazeActive = true
            eventInfo = currentEvents.current
        } else if (currentEvents.next?.id.toLowerCase() == mazeData.id.toLowerCase()) {
            eventInfo = currentEvents.next
        }
    }

    
    return { mazeActive, eventInfo }
}
