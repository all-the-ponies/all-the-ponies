import { fetchGameData, loadGameData, type GameData } from "@/scripts/gameData";
import type { GlobalContext } from "vike/types";


export async function onCreateGlobalContext(globalContext: GlobalContext) {
    await loadGameData()
}
