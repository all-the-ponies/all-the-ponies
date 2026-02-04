import type { Config } from "vike/types";
import vikeVue from 'vike-vue/config'
import vikeVuePinia from 'vike-vue-pinia/config'
import vikePhoton from 'vike-photon/config'

export default {
    extends: [vikeVue, vikeVuePinia, vikePhoton],
    photon: {
        server: '../server/server.ts', // relative to the root
    },
    
    disableUrlNormalization: true,
    // clientRouting: true,
    hydrationCanBeAborted: false,
    prefetchStaticAssets: false,

    passToClient: ['locale'],
} satisfies Config
