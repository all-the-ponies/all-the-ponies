import vikeVuePinia from 'vike-vue-pinia/config';
import vikeVue from 'vike-vue/config';
import type { Config } from "vike/types";

export default {
    extends: [vikeVue, vikeVuePinia],
    
    disableUrlNormalization: true,
    // clientRouting: true,
    hydrationCanBeAborted: false,
    prefetchStaticAssets: false,

    viewport: null,

    passToClient: ['locale', 'gameData'],
} satisfies Config
