import { loadGameData, setGameData, type GameData } from "@/scripts/gameData";
import type { GlobalContext } from "vike/types";


export async function onCreateGlobalContext(globalContext: GlobalContext & {gameData: GameData}) {
    await setGameData()
    
    if (!globalContext.gameData) {
        // console.log('loading')
        // globalContext.gameData = await loadGameData()
        // console.log('loaded')
    }
}
