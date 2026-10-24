/**
 * The Portfolio dropdown categories. Gallery photos come from the photo store
 * (uploaded via /admin/photos, filed under the slug). `hasGallery: false`
 * (Events) shows an inquiry prompt; once photos are uploaded to it, they show
 * above the prompt.
 *
 * Categories with `stories` list their stories (see /admin/stories) instead of,
 * or above, the gallery, and each story gets its own page.
 */
export interface PortfolioCategory {
  slug: string
  name: string
  description: string
  /** What a client books, for the "Book your ___ today" prompt, e.g. "engagement session" */
  bookingLabel: string
  hasGallery: boolean
  stories?: StoryCopy
}

/** Words used around a category's stories */
export interface StoryCopy {
  /** Hero eyebrow, e.g. "A Wedding Story" */
  eyebrow: string
  /** Back link on a story page, e.g. "All Weddings" */
  backLabel: string
  ctaHeading: string
  ctaBody: string
}

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  {
    slug: 'couples',
    name: 'Couples',
    description: 'Candid, unposed connection between two people building a life together.',
    bookingLabel: 'couples session',
    hasGallery: true,
  },
  {
    slug: 'engagements',
    name: 'Engagements',
    description: "Celebrating the season between 'yes' and 'I do'.",
    bookingLabel: 'engagement session',
    hasGallery: true,
  },
  {
    slug: 'weddings',
    name: 'Weddings',
    description: 'From quiet getting-ready moments to the last dance, documented with an editorial eye.',
    bookingLabel: 'wedding',
    hasGallery: true,
    stories: {
      eyebrow: 'A Wedding Story',
      backLabel: 'All Weddings',
      ctaHeading: 'Let’s plan your day, hour by hour.',
      ctaBody: 'I’ll help you build a timeline around the best light, so nothing on your day feels rushed.',
    },
  },
  {
    slug: 'maternity',
    name: 'Maternity',
    description: 'Soft, timeless portraits that honor the season of waiting and becoming.',
    bookingLabel: 'maternity session',
    hasGallery: true,
  },
  {
    slug: 'family',
    name: 'Family',
    description: 'Candid, unposed connection between the people who matter most to you.',
    bookingLabel: 'family session',
    hasGallery: true,
  },
  {
    slug: 'seniors',
    name: 'Seniors',
    description: 'Confident, editorial portraits to mark the milestone.',
    bookingLabel: 'senior session',
    hasGallery: true,
  },
  {
    slug: 'grads',
    name: 'Grads',
    description: 'Celebrating the achievement, in the places that made it happen.',
    bookingLabel: 'grad session',
    hasGallery: true,
  },
  {
    slug: 'events',
    name: 'Events',
    description: 'Every gathering worth remembering, documented as it unfolds.',
    bookingLabel: 'event',
    hasGallery: false,
    stories: {
      eyebrow: 'An Event Story',
      backLabel: 'All Events',
      ctaHeading: 'Let’s plan your event.',
      ctaBody: 'Tell me about your gathering and I’ll make sure every moment worth remembering is covered.',
    },
  },
  {
    slug: 'creative',
    name: 'Creative',
    description: 'Styled concepts and editorial shoots, each one built around its own story.',
    bookingLabel: 'creative session',
    hasGallery: true,
    stories: {
      eyebrow: 'A Creative Story',
      backLabel: 'All Creative',
      ctaHeading: 'Let’s build your concept.',
      ctaBody: 'Bring the idea, the mood or just a feeling, and we’ll shape it into a shoot that’s entirely yours.',
    },
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
