/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { applySeo } from '@/utils/seo'
import { AUTH_MODE, currentUser, requiresSignIn } from '@/auth'
import { previewTokenFrom, rememberPreviewToken } from '@/utils/storyPreview'

import { RouteLocationNormalized } from 'vue-router';
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  extendRoutes: (autoRoutes) => setupLayouts(autoRoutes),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollBehavior(to: RouteLocationNormalized, from: RouteLocationNormalized, savedPosition: null | { left: number, top: number }) {
    // always scroll to top
    return { top: 0 }
  },
})

// A draft preview arrives as "#preview=<token>". Keep the token for this tab and take it out of the address
// before the page shows, so it isn't left in the address bar, in history, or in what analytics records.
router.beforeEach(to => {
  const token = previewTokenFrom(to.hash)
  if (!token) return true
  rememberPreviewToken(to.path, token)
  return { path: to.path, query: to.query, hash: '', replace: true }
})

// Static Web Apps guards the signed-in pages itself (staticwebapp.config.json). Behind a Worker nothing does,
// so the app sends anyone who isn't signed in to sign in first. This only decides which page to show: the
// API checks the person's token on every call, whatever the browser does.
if (AUTH_MODE === 'external') {
  router.beforeEach(async to => {
    if (!requiresSignIn(to.path) || await currentUser()) {
      return true
    }
    return { path: '/auth/sign-in', query: { returnTo: to.fullPath } }
  })
}

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
