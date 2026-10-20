/**
 * Stories: a wedding, event or other session told as its own page. Served by
 * /api/stories (published list) and /api/stories/{slug} (one page); managed at
 * /admin/stories.
 */
import type { PortfolioPhoto } from './photoUrls'

export type StoryStatus = 'Draft' | 'Unlisted' | 'Published'

/** The hero's details; every field but the title is optional */
export interface StoryDetails {
  title: string
  description: string | null
  /** Calendar date, "yyyy-MM-dd" */
  eventDate: string | null
  venueName: string | null
  city: string | null
  state: string | null
}

export interface StorySummary extends StoryDetails {
  id: string
  slug: string
  category: string
  /** The hero photo, else the first photo */
  cover: PortfolioPhoto | null
  photoCount: number
}

export interface Story extends StoryDetails {
  id: string
  slug: string
  category: string
  status: StoryStatus
  seoTitle: string | null
  seoDescription: string | null
  hero: PortfolioPhoto | null
  photos: PortfolioPhoto[]
}

export function storyPath(story: Pick<StorySummary, 'category' | 'slug'>): string {
  return `/portfolio/${story.category}/${story.slug}`
}

/**
 * "October 18, 2026". The date has no time or zone, so it's built from its parts:
 * `new Date('2026-10-18')` would be UTC midnight, which shows as the 17th in Florida.
 */
export function formatStoryDate(eventDate: string | null, month: 'long' | 'short' = 'long'): string | null {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return date.toLocaleDateString('en-US', { month, day: 'numeric', year: 'numeric' })
}

/** "Tallahassee, FL", or whichever of the two is filled in */
export function storyPlace(story: Pick<StoryDetails, 'city' | 'state'>): string | null {
  return [story.city, story.state].map(s => s?.trim()).filter(Boolean).join(', ') || null
}

/** The date, venue and place cells the hero shows, leaving out any that are empty */
export function storyMeta(story: StoryDetails): { label: string, value: string }[] {
  return [
    { label: 'Date', value: formatStoryDate(story.eventDate) },
    { label: 'Venue', value: story.venueName?.trim() || null },
    { label: 'Place', value: storyPlace(story) },
  ].filter((cell): cell is { label: string, value: string } => !!cell.value)
}

/**
 * Splits a title around " & " so the ampersand can be styled:
 * "Emily & James" → ["Emily", "James"]; no ampersand → [title]
 */
export function titleParts(title: string): string[] {
  const index = title.indexOf(' & ')
  return index > 0 ? [title.slice(0, index), title.slice(index + 3)] : [title]
}

/**
 * URL slug from a title and venue, matching Elysian's StorySlugs.FromTitle:
 * "Emily & James" at "Goodwood Museum" → "emily-and-james-goodwood-museum"
 */
export function storySlug(title: string, venueName?: string | null): string {
  const source = (venueName?.trim() ? `${title} ${venueName}` : title).replace(/[&+]/g, ' and ')
  const slug = source
    .normalize('NFD')
    .replace(/[̀-ͯ'’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/, '')
  return slug || 'story'
}

export const STORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Alt text for a story photo that has none: "Emily & James at Goodwood Museum, photo 12 of 84" */
export function storyPhotoAlt(story: Pick<StoryDetails, 'title' | 'venueName'>, photo: PortfolioPhoto, index: number, total: number): string {
  if (photo.altText?.trim()) return photo.altText
  const where = story.venueName ? ` at ${story.venueName}` : ''
  return `${story.title}${where}, photo ${index + 1} of ${total}, by Aspen Smitha Photography`
}
