/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string
  /** Public base of the reserved placement images, ending in the tenant folder */
  readonly VITE_PLACEMENT_IMAGE_BASE?: string
  /** "cdn" (fixed CDN URLs) or "api" (rollback: /api/portfolio as before) */
  readonly VITE_PLACEMENT_SOURCE?: 'cdn' | 'api'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
