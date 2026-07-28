import api from "@/scripts/api";
import type { LTSEvent } from "@/scripts/api.types";
import type { PageContext } from "vike/types";

export interface Data {
    mazeActive: boolean,
    eventInfo: LTSEvent | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const currentEvents = await api.getLTSEvents()
    let eventInfo = null
    let mazeActive = false

    if (currentEvents.current?.id == 'upd59_maze_tls') {
        mazeActive = true
        eventInfo = currentEvents.current
    } else if (currentEvents.next?.id == 'upd59_maze_tls') {
        eventInfo = currentEvents.next
    }
    
    return { mazeActive, eventInfo }
}
