/**
 * plugins/webVitals.ts
 *
 * Real-visitor LCP, CLS and INP sent to Google Analytics as "web_vitals"
 * events, to compare load speed before and after a change (e.g. the fixed
 * CDN URLs for Home/Portfolio photos). In GA4, register `metric_name`,
 * `metric_value` and `metric_rating` as custom dimensions/metrics to chart them.
 * Production only, like the rest of analytics; the admin area is excluded.
 */
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals'
import { event } from 'vue-gtag'

function send(metric: Metric) {
  if (window.location.pathname.startsWith('/admin')) return

  event('web_vitals', {
    metric_name: metric.name,
    // CLS is a small unitless score; scale it so GA's integer values keep precision
    metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
    metric_id: metric.id,
    page_path: window.location.pathname,
    non_interaction: true,
  })
}

export function reportWebVitals() {
  onLCP(send)
  onCLS(send)
  onINP(send)
}
