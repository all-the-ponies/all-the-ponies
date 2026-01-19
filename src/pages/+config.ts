import type { Config } from "vike/types";
import vikeVue from 'vike-vue/config'
import vikeVuePinia from 'vike-vue-pinia/config'
import vikePhoton from 'vike-photon/config'

export default {
    extends: [vikeVue, vikeVuePinia, vikePhoton],
    photon: {
        server: 'src/server/server.ts',
    } ,
    
    trailingSlash: true,
    disableUrlNormalization: false,
    // clientRouting: true,
    hydrationCanBeAborted: false,
    prefetchStaticAssets: false,
} satisfies Config
