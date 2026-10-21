/**
 * Reserved CDN images for site placements: every slot on the Home and
 * Portfolio pages has fixed URLs, so the page can request (and the HTML can
 * preload) its images without asking the API what to show. The admin's
 * choices are published server-side into those same URLs and purged from
 * Cloudflare by the Function App (Elysian's PublishPlacementsCommand).
 *
 *   {base}/{name}-{width}.webp, e.g.
 *   https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-720.webp
 *
 * Every variant is cropped to the slot's ratio, so width and height are known
 * here without a database call. A slot is never empty: the publisher falls
 * back to a category photo, the "site-default" photo, then a plain frame.
 *
 * Keep this file free of `@/` imports and `import.meta.env`: vite.config.mts
 * imports it to write the hero preload into index.html.
 */
import catalog from '../content/placementSlots.json'

export interface PlacementSlotSpec {
  /** Placement key in the database (sitePlacements.ts) */
  key: string
  /** Public file name stem; never rename, it's a URL */
  name: string
  /** width / height of every variant */
  ratio: number
  /** Variant widths in px, ascending */
  widths: number[]
  alt: string
  /** Category whose first photo fills the slot when the admin hasn't picked one */
  fallbackCategory?: string
}

export const PLACEMENT_SLOTS: readonly PlacementSlotSpec[] = catalog.slots

/** Placement key of the photo shown in any slot that has nothing else */
export const SITE_DEFAULT_PLACEMENT: string = catalog.siteDefaultKey

export function placementSlot(key: string): PlacementSlotSpec | undefined {
  return PLACEMENT_SLOTS.find(s => s.key === key)
}

/** Must match PlacementSlot.HeightFor in Elysian (Application/Features/Placements/PlacementCatalog.cs) */
export function placementHeight(slot: PlacementSlotSpec, width: number): number {
  return Math.round(width / slot.ratio)
}

export function placementUrl(base: string, slot: PlacementSlotSpec, width: number): string {
  return `${base.replace(/\/$/, '')}/${slot.name}-${width}.webp`
}

export function placementSrcset(base: string, slot: PlacementSlotSpec): string {
  return slot.widths.map(w => `${placementUrl(base, slot, w)} ${w}w`).join(', ')
}

/** The `src` fallback and the width/height attributes: the middle variant */
export function placementDefaultWidth(slot: PlacementSlotSpec): number {
  return slot.widths[Math.min(1, slot.widths.length - 1)]
}

/** `<link rel="preload">` for an image the browser should start before any JS runs */
export function placementPreloadTag(base: string, slot: PlacementSlotSpec, sizes: string, highPriority = false): string {
  const href = placementUrl(base, slot, placementDefaultWidth(slot))
  const priority = highPriority ? ' fetchpriority="high"' : ''
  return `<link rel="preload" as="image" href="${href}" imagesrcset="${placementSrcset(base, slot)}" imagesizes="${sizes}" type="image/webp"${priority}>`
}
