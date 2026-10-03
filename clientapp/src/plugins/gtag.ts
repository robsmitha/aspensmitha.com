/**
 * plugins/gtag.ts
 *
 * Google Analytics 4 via vue-gtag. Page views are sent on every route change;
 * the admin area is excluded so Aspen's own visits don't skew the numbers.
 */

import { createGtag } from 'vue-gtag'
import router from '../router'

export const GA_MEASUREMENT_ID = 'G-3DVCNSHK1H'

export default createGtag({
  tagId: GA_MEASUREMENT_ID,
  pageTracker: {
    router,
    exclude: route => route.path.startsWith('/admin'),
    // vue-gtag defaults page_title to the route name (e.g. "/portfolio/[category]");
    // applySeo has already set the real <title> by the time this runs
    template: route => ({
      page_path: route.path,
      page_title: document.title,
    }),
  },
})
