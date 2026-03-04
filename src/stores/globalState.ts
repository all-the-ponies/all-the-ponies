import { defineStore } from "pinia"

export const useGlobalStateStore = defineStore('state', {
    state: () => {
        return {
            dismissedNotices: [] as string[],
        }
    },
    persist: true,
})
