/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import search from '@/pages/search.vue'

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

export default router
