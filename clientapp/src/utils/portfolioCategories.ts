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
  /** Replaces "Let's create yours." in the booking prompt at the bottom of the category page */
  bookingHeading?: string
  /** Leaves out the sentence under the booking prompt's heading */
  hideBookingCopy?: boolean
  /** The booking prompt's button reads "Inquire Now" and opens the contact form instead of booking */
  inquireInstead?: boolean
  stories?: StoryCopy
}

/** Words used around a category's stories */
export interface StoryCopy {
  /** Hero eyebrow, e.g. "A Wedding Story" */
  eyebrow: string
  /** Back link on a story page, e.g. "All Weddings" */
  backLabel: string
  ctaHeading: string
}

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  {
    slug: 'couples',
    name: 'Couples',
    description: 'Tallahassee Couples Photographer | Aspen Smitha Photography',
    bookingLabel: 'couples session',
    hasGallery: true,
    bookingHeading: 'Let’s capture your love story',
    hideBookingCopy: true,
  },
  {
    slug: 'engagements',
    name: 'Engagements',
    description: 'Tallahassee Engagement Photographer | Aspen Smitha Photography',
    bookingLabel: 'engagement session',
    hasGallery: true,
    bookingHeading: 'Let’s make it official.',
    hideBookingCopy: true,
  },
  {
    slug: 'weddings',
    name: 'Weddings',
    description: 'Tallahassee Wedding Photographer | Aspen Smitha Photography',
    bookingLabel: 'wedding',
    hasGallery: true,
    bookingHeading: 'Your wedding plans start here.',
    hideBookingCopy: true,
    inquireInstead: true,
    stories: {
      eyebrow: 'A Wedding Story',
      backLabel: 'All Weddings',
      ctaHeading: 'Your wedding plans start here.',
    },
  },
  {
    slug: 'maternity',
    name: 'Maternity',
    description: 'Tallahassee Maternity Photographer | Aspen Smitha Photography',
    bookingLabel: 'maternity session',
    hasGallery: true,
    bookingHeading: 'Ready to celebrate your little one?',
    hideBookingCopy: true,
  },
  {
    slug: 'family',
    name: 'Family',
    description: 'Tallahassee Family Photographer | Aspen Smitha Photography',
    bookingLabel: 'family session',
    hasGallery: true,
    bookingHeading: 'Let’s create your gallery wall.',
    hideBookingCopy: true,
  },
  {
    slug: 'seniors',
    name: 'Seniors',
    description: 'Tallahassee Senior Photographer | Aspen Smitha Photography',
    bookingLabel: 'senior session',
    hasGallery: true,
    bookingHeading: 'Start your next adventure!',
    hideBookingCopy: true,
  },
  {
    slug: 'grads',
    name: 'Grads',
    description: 'Tallahassee Graduation Photographer | Aspen Smitha Photography',
    bookingLabel: 'grad session',
    hasGallery: true,
    bookingHeading: 'Eternalize your accomplishment!',
    hideBookingCopy: true,
  },
  {
    slug: 'events',
    name: 'Events',
    description: 'Tallahassee Event Photographer | Aspen Smitha Photography',
    bookingLabel: 'event',
    hasGallery: false,
    stories: {
      eyebrow: 'An Event Story',
      backLabel: 'All Events',
      ctaHeading: 'Let’s plan your event.',
    },
  },
  {
    slug: 'creative',
    name: 'Creative',
    description: "Not every photoshoot begins with a client inquiry. Sometimes, an idea simply pops into my head, and I can’t help but bring it to life. These creative sessions are offered as complimentary model collaborations in exchange for permission to share the resulting images. Interested in collaborating? Reach out through my contact page!",
    bookingLabel: 'creative session',
    hasGallery: true,
    bookingHeading: 'Let’s collaborate!',
    hideBookingCopy: true,
    inquireInstead: true,
    stories: {
      eyebrow: 'A Creative Story',
      backLabel: 'All Creative',
      ctaHeading: 'Let’s Collaborate!',
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
