/**
 * Photos come from /api/portfolio as metadata only; the bytes are pre-sized,
 * immutable WebP variants in blob storage (behind the CDN) at
 * `{srcBase}/{width}.webp`, one per entry in `widths`.
 */
import { getPortfolioCategory } from './portfolioCategories'

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
 * The parts of a photo needed to render it from its WebP variants. Portfolio
 * photos and Instagram thumbnails (same storage layout) both satisfy this.
 */
export type PhotoSource = Pick<PortfolioPhoto, 'srcBase' | 'widths' | 'width' | 'height' | 'placeholder'>
  & Partial<Pick<PortfolioPhoto, 'altText' | 'focusX' | 'focusY'>>

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
  /** Portrait in a cols 12 / md 5 column, capped at 500px wide (landing intro, contact, about) */
  portrait: '(max-width: 499px) 100vw, (max-width: 959px) 500px, (max-width: 1190px) 42vw, 500px',
  /** Landing specialties: cols 12 / md 4 in a row capped at 1320px, cards capped at 420px */
  specialty: '(max-width: 419px) 100vw, (max-width: 959px) 420px, (max-width: 1319px) 33vw, 420px',
  /** cols 12 / md 7 */
  sevenTwelfths: '(max-width: 959px) 100vw, 58vw',
  /** Landing hero strip: fixed 240px on mobile, 340px otherwise */
  showcase: '(max-width: 1279px) 240px, 340px',
  /** Instagram grid: three across in a section capped at 960px */
  instagram: '(max-width: 959px) 33vw, 310px',
} as const

export function photoUrl(photo: PhotoSource, width: number): string {
  return `${photo.srcBase}/${width}.webp`
}

/** Smallest variant at least `width` wide, else the largest there is */
export function photoSrc(photo: PhotoSource, width = 800): string {
  const sorted = [...photo.widths].sort((a, b) => a - b)
  const pick = sorted.find(w => w >= width) ?? sorted[sorted.length - 1]
  return photoUrl(photo, pick)
}

export function photoSrcset(photo: PhotoSource): string {
  return photo.widths.map(w => `${photoUrl(photo, w)} ${w}w`).join(', ')
}

/**
 * Alt text: the admin-entered text when there is one, else a description from
 * the category so no photo goes undescribed for screen readers or image search
 */
export function photoAlt(photo: Partial<Pick<PortfolioPhoto, 'altText' | 'category'>>): string {
  if (photo.altText?.trim()) return photo.altText
  const category = photo.category ? getPortfolioCategory(photo.category) : undefined
  return category
    ? `${category.name} photography by Aspen Smitha, Tallahassee photographer`
    : 'Photo by Aspen Smitha Photography, Tallahassee'
}

/** CSS object-position from the admin-chosen focal point, so cover crops keep faces in frame */
export function photoPosition(photo: PhotoSource): string {
  return `${Math.round((photo.focusX ?? 0.5) * 100)}% ${Math.round((photo.focusY ?? 0.5) * 100)}%`
}
