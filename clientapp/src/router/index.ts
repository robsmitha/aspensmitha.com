/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import search from '@/pages/search.vue'
import { applySeo } from '@/utils/seo'

import { RouteLocationNormalized } from 'vue-router';
const routes = [
  {
    path: '/search/:serialNumber?',
    name: 'search',
    component: search,
    props: true
  }
];
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  extendRoutes: (autoRoutes) => {
    const allRoutes = [...autoRoutes, ...routes]
    return setupLayouts(allRoutes);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollBehavior(to: RouteLocationNormalized, from: RouteLocationNormalized, savedPosition: null | { left: number, top: number }) {
    // always scroll to top
    return { top: 0 }
  },
})

router.afterEach(to => applySeo(to))

// After a new deploy, hashed chunks from the previous build are gone. A tab that was
// open before the deploy will 404 when lazy-loading a route, so do one hard reload to
// pick up the new index.html. The sessionStorage guard prevents a reload loop.
const RELOAD_KEY = 'chunk-reload'
const isChunkLoadError = (err: unknown) =>
  err instanceof Error &&
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(err.message)

const reloadOnce = (path?: string) => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return false
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch { /* storage unavailable — still reload */ }
  if (path) window.location.assign(path)
  else window.location.reload()
  return true
}

window.addEventListener('vite:preloadError', event => {
  if (reloadOnce()) event.preventDefault()
})

router.onError((err, to) => {
  if (isChunkLoadError(err)) reloadOnce(to.fullPath)
})

router.isReady().then(() => {
  try { sessionStorage.removeItem(RELOAD_KEY) } catch { /* ignore */ }
})

export default router
