import { PORTFOLIO_CATEGORIES } from './portfolioCategories'

/**
 * Every spot on the public site that shows a hand-picked photo. The site owns
 * this list (like a theme's image slots); the database only stores which photo
 * fills each spot, so every spot can show a different photo.
 *
 * Keys are stored in the database: change labels freely, never keys. When a
 * component starts showing a new spot, add it here so the admin can fill it
 * and draw it in PlacementMap.vue.
 */
export type SitePage = 'home' | 'about' | 'contact' | 'portfolio'

export const SITE_PAGES: Record<SitePage, { name: string, path: string }> = {
  home: { name: 'Home', path: '/' },
  about: { name: 'About', path: '/about-me' },
  contact: { name: 'Contact', path: '/contact' },
  portfolio: { name: 'Portfolio', path: '/portfolio' },
}

export interface SitePlacement {
  key: string
  page: SitePage
  /** Block id in PlacementMap.vue */
  area: string
  label: string
}

export const SITE_PLACEMENTS: readonly SitePlacement[] = [
  ...[1, 2, 3, 4, 5].map(n => ({ key: `home-hero-${n}`, page: 'home' as const, area: `hero-${n}`, label: `Hero strip, photo ${n}` })),
  { key: 'home-intro', page: 'home', area: 'intro', label: 'Intro portrait ("Hello, I\'m Aspen")' },
  { key: 'home-specialty-weddings', page: 'home', area: 'specialty-weddings', label: 'Specialties: Weddings' },
  { key: 'home-specialty-maternity', page: 'home', area: 'specialty-maternity', label: 'Specialties: Maternity' },
  { key: 'home-specialty-family', page: 'home', area: 'specialty-family', label: 'Specialties: Family' },
  { key: 'home-recent-large', page: 'home', area: 'recent-large', label: 'Recent Sessions, large photo' },
  { key: 'home-recent-top', page: 'home', area: 'recent-top', label: 'Recent Sessions, top right' },
  { key: 'home-recent-bottom', page: 'home', area: 'recent-bottom', label: 'Recent Sessions, bottom right' },
  { key: 'home-cta', page: 'home', area: 'cta', label: 'Closing banner ("Inquire Now")' },
  { key: 'about-story', page: 'about', area: 'story', label: 'Story portrait' },
  { key: 'about-cta', page: 'about', area: 'cta', label: 'Closing banner ("Let\'s chat!")' },
  { key: 'contact-portrait', page: 'contact', area: 'portrait', label: 'Portrait beside the form' },
  ...PORTFOLIO_CATEGORIES.map(c => ({
    key: portfolioCoverKey(c.slug),
    page: 'portfolio' as const,
    area: `cover-${c.slug}`,
    label: `${c.name} tile cover`,
  })),
]

/** Landing hero strip, in display order */
export const HERO_SHOWCASE_PLACEMENTS = [1, 2, 3, 4, 5].map(n => `home-hero-${n}`)

export function portfolioCoverKey(categorySlug: string) {
  return `portfolio-cover-${categorySlug}`
}

export function getPlacement(key: string): SitePlacement | undefined {
  return SITE_PLACEMENTS.find(p => p.key === key)
}

/** "Home › Intro portrait (…)" */
export function placementTitle(key: string) {
  const placement = getPlacement(key)
  return placement ? `${SITE_PAGES[placement.page].name} › ${placement.label}` : key
}

/** Placements grouped by page in site order, e.g. for a photo's "Where this appears" */
export function placementsByPage(keys: readonly string[]) {
  const placements = keys.map(getPlacement).filter((p): p is SitePlacement => !!p)
  return (Object.keys(SITE_PAGES) as SitePage[])
    .map(page => ({ page, ...SITE_PAGES[page], placements: placements.filter(p => p.page === page) }))
    .filter(group => group.placements.length)
}
