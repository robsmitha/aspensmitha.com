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
  /** "swa" (default: Static Web Apps signs people in) or "external" (Entra External ID, behind a Worker) */
  readonly VITE_AUTH_MODE?: 'swa' | 'external'
  /** "external" mode only: the sign-in tenant, the app's client id, and the API scope to ask for */
  readonly VITE_AUTH_AUTHORITY?: string
  readonly VITE_AUTH_CLIENT_ID?: string
  readonly VITE_AUTH_SCOPE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
