import type { PortfolioPhoto } from './photoUrls'

/**
 * TEMPORARY migration fallback. Until Aspen's originals are uploaded through
 * /admin/photos, any spot or category with no real photo keeps showing the
 * Wix-hosted image from the POC so the site never renders empty. Delete this
 * file (and `legacyImages` in portfolioCategories.ts) once every spot and
 * category has real photos.
 */
const MATERNITY = '6fbe05_cc85442164fb476aa6f8421a953e9599'
const BRIDE = '6fbe05_de9a3dfe1d1b404f828c8130b99e8c94'
const COUPLE_JUMP = '6fbe05_64e49ea99afe4fcfbebc03284e5dd22a'
const FAMILY = '6fbe05_586bac3b867e4505a824b734b5d81105'
const COUPLE_CLOSE_UP = '6fbe05_d5d54e8807a2448186a980506019d7d4'
const ASPEN_PORTRAIT = '6fbe05_cbdf63b0f4564fddb801529ad1d17c6d'
const ASPEN_FAMILY = '6fbe05_36b9a25632984a99b0022e4605d55c0f'

/** Keyed by spot (see sitePlacements.ts). Portfolio covers fall back to the category's first photo instead. */
const LEGACY_PLACEMENT_IDS: Record<string, string> = {
  'home-hero-1': MATERNITY,
  'home-hero-2': BRIDE,
  'home-hero-3': COUPLE_JUMP,
  'home-hero-4': FAMILY,
  'home-hero-5': COUPLE_CLOSE_UP,
  'home-intro': ASPEN_PORTRAIT,
  'home-specialty-weddings': BRIDE,
  'home-specialty-maternity': MATERNITY,
  'home-specialty-family': FAMILY,
  'home-recent-large': COUPLE_JUMP,
  'home-recent-top': COUPLE_CLOSE_UP,
  'home-recent-bottom': MATERNITY,
  'home-cta': FAMILY,
  'about-story': ASPEN_FAMILY,
  'about-cta': BRIDE,
  'contact-portrait': ASPEN_PORTRAIT,
}

export function legacyPhoto(wixId: string, category = '', placements: string[] = []): PortfolioPhoto {
  return {
    id: `legacy-${wixId}`,
    category,
    placements,
    sortOrder: 0,
    altText: null,
    // Unknown until loaded; every current placement sets its own aspect ratio
    width: 0,
    height: 0,
    focusX: 0.5,
    focusY: 0.5,
    placeholder: null,
    srcBase: '',
    widths: [400, 800, 1200, 1600],
    legacyWixId: wixId,
  }
}

export function legacyPlacementPhoto(key: string): PortfolioPhoto | undefined {
  const id = LEGACY_PLACEMENT_IDS[key]
  return id ? legacyPhoto(id, '', [key]) : undefined
}
