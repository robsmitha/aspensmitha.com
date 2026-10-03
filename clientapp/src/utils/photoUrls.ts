/**
 * Photos come from /api/portfolio as metadata only; the bytes are pre-sized,
 * immutable WebP variants in blob storage (behind the CDN) at
 * `{srcBase}/{width}.webp`, one per entry in `widths`.
 */
export interface PortfolioPhoto {
  id: string
  category: string
  /** Site spots this photo fills (see sitePlacements.ts) */
  placements: string[]
  sortOrder: number
  altText: string | null
  width: number
  height: number
  focusX: number
  focusY: number
  /** Tiny blurred preview as a data URI — no extra request */
  placeholder: string | null
  srcBase: string
  widths: number[]
}

/**
 * `sizes` presets matching the layouts that use them, so the browser can pick
 * the right variant from `srcset` before layout. Vuetify breakpoints: sm 600,
 * md 960, lg 1280.
 */
export const PHOTO_SIZES = {
  fullBleed: '100vw',
  /** cols 12 / sm 6 / md 4 */
  gallery: '(max-width: 599px) 100vw, (max-width: 959px) 50vw, 33vw',
  /** cols 6 / md 3 */
  tile: '(max-width: 959px) 50vw, 25vw',
  /** cols 12 / md 4 */
  third: '(max-width: 959px) 100vw, 33vw',
  /** cols 12 / md 5 */
  fiveTwelfths: '(max-width: 959px) 100vw, 42vw',
  /** cols 12 / md 7 */
  sevenTwelfths: '(max-width: 959px) 100vw, 58vw',
  /** Landing hero strip: fixed 240px on mobile, 340px otherwise */
  showcase: '(max-width: 1279px) 240px, 340px',
} as const

export function photoUrl(photo: PortfolioPhoto, width: number): string {
  return `${photo.srcBase}/${width}.webp`
}

/** Smallest variant at least `width` wide, else the largest there is */
export function photoSrc(photo: PortfolioPhoto, width = 800): string {
  const sorted = [...photo.widths].sort((a, b) => a - b)
  const pick = sorted.find(w => w >= width) ?? sorted[sorted.length - 1]
  return photoUrl(photo, pick)
}

export function photoSrcset(photo: PortfolioPhoto): string {
  return photo.widths.map(w => `${photoUrl(photo, w)} ${w}w`).join(', ')
}

/** CSS object-position from the admin-chosen focal point, so cover crops keep faces in frame */
export function photoPosition(photo: PortfolioPhoto): string {
  return `${Math.round(photo.focusX * 100)}% ${Math.round(photo.focusY * 100)}%`
}
