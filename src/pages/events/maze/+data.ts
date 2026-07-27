import api from "@/scripts/api";
import type { LTSEvent } from "@/scripts/api.types";
import type { PageContext } from "vike/types";

export interface Data {
    maze_active: boolean,
    event_info: LTSEvent | null,
}

export async function data(pageContext: PageContext): Promise<Data> {
    const currentEvents = await api.getLTSEvents()
    let event_info = null
    let maze_active = false

    if (currentEvents.current?.id == 'upd59_maze_tls') {
        maze_active = true
        event_info = currentEvents.current
    } else if (currentEvents.next?.id == 'upd59_maze_tls') {
        event_info = currentEvents.next
    }
    
    return { maze_active, event_info }
}
