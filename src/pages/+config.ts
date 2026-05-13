import type { Config } from "vike/types";
import vikeVue from 'vike-vue/config'
import vikeVuePinia from 'vike-vue-pinia/config'

export default {
    extends: [vikeVue, vikeVuePinia],
    
    disableUrlNormalization: true,
    // clientRouting: true,
    hydrationCanBeAborted: false,
    prefetchStaticAssets: false,

    viewport: null,

    passToClient: ['locale'],
} satisfies Config
