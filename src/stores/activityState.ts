import type { GameObjectId } from "@/types/gameDataTypes";
import { defineStore } from "pinia";

export const useActivityState = defineStore('gameState', {
    state: () => {
        return {
            guesser: {
                playing: false,
                guessedPonies: [] as GameObjectId[],
                time: 0,
                currentPony: '' as GameObjectId,
            }
        }
    },
    persist: true,
})
