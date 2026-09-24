/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify from './vuetify'
import pinia from '../store'
import router from '../router'

import 'highlight.js/styles/night-owl.css'
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
    .use(hljsVuePlugin)
}
