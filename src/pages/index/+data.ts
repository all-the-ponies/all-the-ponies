import api from "@/scripts/api";
import type { LTSEvents } from "@/scripts/api.types";
import type { PageContext } from "vike/types";

export interface Data {
    eventInfo?: LTSEvents,
}

export async function data(pageContext: PageContext) {
    try {
        const eventInfo = await api.getLTSEvents()
        return { eventInfo }
    } catch (error) {
        console.error(error)
        return {}
    }
}
