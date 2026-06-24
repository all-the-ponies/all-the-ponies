import { loadGameData, setGameData, type GameData } from "@/scripts/gameData";
import type { GlobalContext } from "vike/types";


export async function onCreateGlobalContext(globalContext: GlobalContext & {gameData: GameData}) {
    console.log('Loading game data (onCreateGlobalContext)')
    setGameData(await loadGameData())
    console.log('Loaded game data (onCreateGlobalContext)')
    
    if (!globalContext.gameData) {
        // console.log('loading')
        // globalContext.gameData = await loadGameData()
        // console.log('loaded')
    }
}
