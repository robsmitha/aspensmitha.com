/**
 * The Portfolio dropdown categories. Gallery photos come from the photo store
 * (uploaded via /admin/photos, filed under the slug). `hasGallery: false`
 * (Events) shows an inquiry prompt; once photos are uploaded to it, they show
 * above the prompt.
 */
export interface PortfolioCategory {
  slug: string
  name: string
  description: string
  hasGallery: boolean
}

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  {
    slug: 'couples',
    name: 'Couples',
    description: 'Candid, unposed connection between two people building a life together.',
    hasGallery: true,
  },
  {
    slug: 'engagements',
    name: 'Engagements',
    description: "Celebrating the season between 'yes' and 'I do'.",
    hasGallery: true,
  },
  {
    slug: 'weddings',
    name: 'Weddings',
    description: 'From quiet getting-ready moments to the last dance, documented with an editorial eye.',
    hasGallery: true,
  },
  {
    slug: 'maternity',
    name: 'Maternity',
    description: 'Soft, timeless portraits that honor the season of waiting and becoming.',
    hasGallery: true,
  },
  {
    slug: 'family',
    name: 'Family',
    description: 'Candid, unposed connection between the people who matter most to you.',
    hasGallery: true,
  },
  {
    slug: 'seniors',
    name: 'Seniors',
    description: 'Confident, editorial portraits to mark the milestone.',
    hasGallery: true,
  },
  {
    slug: 'grads',
    name: 'Grads',
    description: 'Celebrating the achievement, in the places that made it happen.',
    hasGallery: true,
  },
  {
    slug: 'events',
    name: 'Events',
    description: 'Every gathering worth remembering, documented as it unfolds.',
    hasGallery: false,
  },
]

/**
 * Category for photos used only in featured placements (e.g. Aspen's own
 * portrait). Not in PORTFOLIO_CATEGORIES, so these never appear in a gallery
 * or category tile.
 */
export const SITE_ONLY_CATEGORY = { slug: 'site', name: 'Site only (not in portfolio)' } as const

export function getPortfolioCategory(slug: string): PortfolioCategory | undefined {
  return PORTFOLIO_CATEGORIES.find(c => c.slug === slug)
}
