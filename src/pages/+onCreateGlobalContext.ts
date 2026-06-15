import { loadGameData, type GameData } from "@/scripts/gameData";
import type { GlobalContext } from "vike/types";


export async function onCreateGlobalContext(globalContext: GlobalContext & {gameData: GameData}) {
    if (!globalContext.gameData) {
        console.log('loading')
        globalContext.gameData = await loadGameData()
        console.log('loaded')
    }
}
