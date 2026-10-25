import type { RouteLocationNormalized } from 'vue-router'
import { PORTFOLIO_CATEGORIES, getPortfolioCategory } from './portfolioCategories'

/**
 * Per-page <title>, description, canonical, social tags and breadcrumbs.
 *
 * One source of truth for two consumers:
 * - the Vite build (vite.config.mts) renders `renderSeoHead`/`renderSeoBody`
 *   into a static HTML file per indexable page, so crawlers and link-preview
 *   scrapers that don't run JS still see the right tags, and generates
 *   sitemap.xml from `INDEXABLE_PATHS`
 * - the router (`applySeo`) keeps the tags in sync as the SPA navigates
 *
 * Keep this file free of `@/` imports and browser globals at module level:
 * vite.config.mts imports it directly.
 */
export const SITE_URL = 'https://www.aspensmitha.com'
export const SITE_NAME = 'Aspen Smitha Photography'

interface Crumb {
  name: string
  path: string
}

export interface PageSeo {
  title: string
  description: string
  /** Visible heading for the no-JS fallback */
  heading: string
  breadcrumbs: Crumb[]
  /** Keep private/utility pages out of search results */
  noindex?: boolean
}

/** How people search for each category, e.g. "Tallahassee wedding photographer" */
const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  couples: 'Couples',
  engagements: 'Engagement',
  weddings: 'Wedding',
  maternity: 'Maternity',
  family: 'Family',
  seniors: 'Senior Portrait',
  grads: 'Graduation',
  events: 'Event',
  creative: 'Creative',
}

const HOME_CRUMB: Crumb = { name: 'Home', path: '/' }
const PORTFOLIO_CRUMB: Crumb = { name: 'Portfolio', path: '/portfolio' }
const BOOKING_CRUMB: Crumb = { name: 'Book', path: '/booking' }

const HOME: PageSeo = {
  title: `Tallahassee Wedding, Maternity & Family Photographer | ${SITE_NAME}`,
  description: 'Aspen Smitha Photography is a wedding, maternity, family and portrait photographer based in Tallahassee, Florida, serving North Florida and beyond.',
  heading: `${SITE_NAME} — Tallahassee Wedding, Maternity & Family Photographer`,
  breadcrumbs: [],
}

const PAGES: Record<string, PageSeo> = {
  '/': HOME,
  '/portfolio': {
    title: `Portfolio | ${SITE_NAME}`,
    description: 'Wedding, engagement, couples, maternity, family, senior and graduation photography by Aspen Smitha, a Tallahassee, Florida photographer.',
    heading: 'Portfolio',
    breadcrumbs: [HOME_CRUMB, PORTFOLIO_CRUMB],
  },
  '/about-me': {
    title: `About Aspen | ${SITE_NAME}`,
    description: 'Meet Aspen Smitha, a Tallahassee, Florida photographer capturing weddings, growing families and the milestones in between.',
    heading: 'Meet Your Photographer',
    breadcrumbs: [HOME_CRUMB, { name: 'About', path: '/about-me' }],
  },
  '/investment': {
    title: `Investment & Pricing | ${SITE_NAME}`,
    description: 'Session and wedding collection pricing for Aspen Smitha Photography in Tallahassee, Florida.',
    heading: 'Investment',
    breadcrumbs: [HOME_CRUMB, { name: 'Investment', path: '/investment' }],
  },
  '/booking': {
    title: `Book a Session | ${SITE_NAME}`,
    description: 'View session details and availability, and book your portrait, maternity or senior session with Aspen Smitha Photography in Tallahassee, Florida.',
    heading: 'Book Your Session',
    breadcrumbs: [HOME_CRUMB, BOOKING_CRUMB],
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description: 'Get in touch with Aspen Smitha Photography to check availability for your wedding, maternity, family or portrait session in Tallahassee, Florida.',
    heading: "Let's Connect",
    breadcrumbs: [HOME_CRUMB, { name: 'Contact', path: '/contact' }],
  },
}

/** Every page that belongs in search results and the sitemap */
export const INDEXABLE_PATHS = [
  ...Object.keys(PAGES),
  ...PORTFOLIO_CATEGORIES.map(c => `/portfolio/${c.slug}`),
]

export function seoForPath(path: string): PageSeo {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '')
  const categoryMatch = normalized.match(/^\/portfolio\/([^/]+)$/)
  if (categoryMatch) {
    const category = getPortfolioCategory(decodeURIComponent(categoryMatch[1]))
    if (category) {
      const term = CATEGORY_SEARCH_TERMS[category.slug] ?? category.name
      return {
        title: `Tallahassee ${term} Photographer | ${SITE_NAME}`,
        description: `${category.description} ${term} photography by Aspen Smitha in Tallahassee, Florida.`,
        heading: `${term} Photography`,
        breadcrumbs: [HOME_CRUMB, PORTFOLIO_CRUMB, { name: category.name, path: normalized }],
      }
    }
  }
  // Sessions live in the database, so their pages start from these generic tags and the
  // page fills in the session's own (see applyPageSeo); they're found through /booking's links
  if (/^\/booking\/[^/]+$/.test(normalized)) {
    return {
      ...PAGES['/booking'],
      breadcrumbs: [HOME_CRUMB, BOOKING_CRUMB, { name: 'Session', path: normalized }],
    }
  }
  // A story page; the page swaps in the story's own tags once it loads (see storySeo)
  const storyMatch = normalized.match(/^\/portfolio\/([^/]+)\/[^/]+$/)
  const storyCategory = storyMatch ? getPortfolioCategory(decodeURIComponent(storyMatch[1])) : undefined
  if (storyCategory?.stories) {
    return {
      title: SITE_NAME,
      description: HOME.description,
      heading: storyCategory.stories.eyebrow,
      breadcrumbs: [HOME_CRUMB, PORTFOLIO_CRUMB, { name: storyCategory.name, path: `/portfolio/${storyCategory.slug}` }],
    }
  }
  return PAGES[normalized] ?? { title: SITE_NAME, description: HOME.description, heading: SITE_NAME, breadcrumbs: [], noindex: true }
}

export interface StorySeoInput {
  title: string
  category: string
  description: string | null
  venueName: string | null
  city: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
}

/**
 * Tags for one story. Venue and city lead, since that's how couples search
 * ("Goodwood Museum wedding photographer"):
 * "Emily & James · Goodwood Museum Wedding, Tallahassee | Aspen Smitha Photography"
 */
export function storySeo(story: StorySeoInput, path: string): PageSeo {
  const category = getPortfolioCategory(story.category)
  const term = CATEGORY_SEARCH_TERMS[story.category] ?? category?.name ?? 'Photography'
  const kind = story.venueName ? `${story.venueName} ${term}` : term
  const place = story.city ? `${kind}, ${story.city}` : kind
  const title = story.seoTitle?.trim() || `${story.title} · ${place} | ${SITE_NAME}`

  const where = [story.venueName && `at ${story.venueName}`, story.city && `in ${story.city}`].filter(Boolean).join(' ')
  const fallback = `${story.title}’s ${term.toLowerCase()}${where ? ` ${where}` : ''}, photographed by Aspen Smitha, a Tallahassee, Florida photographer.`
  const description = story.seoDescription?.trim() || truncate(story.description?.trim() || fallback, 160)

  return {
    title,
    description,
    heading: story.title,
    breadcrumbs: [
      HOME_CRUMB,
      PORTFOLIO_CRUMB,
      ...(category ? [{ name: category.name, path: `/portfolio/${category.slug}` }] : []),
      { name: story.title, path },
    ],
    // Unlisted stories open by link but stay out of search
    noindex: story.status !== 'Published',
  }
}

function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ')
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20))}…`
}

/** Share image (og:image); every page uses the site default (the logo) */
export interface SeoImage {
  url: string
  width: number
  height: number
  alt: string
}

export const DEFAULT_SEO_IMAGE: SeoImage = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: 'Aspen Smitha Photography logo',
}

/** Absolute URL; trailing slash only on the root, matching the sitemap */
export function canonicalUrl(path: string): string {
  return SITE_URL + (path === '/' ? '/' : path.replace(/\/$/, ''))
}

function breadcrumbJsonLd(crumbs: Crumb[]): string | null {
  if (!crumbs.length) return null
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: canonicalUrl(c.path),
    })),
  })
}

// ---------------------------------------------------------------------------
// Build time: static HTML for each page (see vite.config.mts)
// ---------------------------------------------------------------------------

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderSeoHead(path: string): string {
  const page = seoForPath(path)
  const url = canonicalUrl(path)
  const crumbs = breadcrumbJsonLd(page.breadcrumbs)
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta name="robots" content="${page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    crumbs ? `<script type="application/ld+json" id="seo-breadcrumbs">${crumbs}</script>` : '',
  ].filter(Boolean).join('\n    ')
}

/** No-JS fallback: the page's heading and description plus links to every page, so crawlers can discover the site */
export function renderSeoBody(path: string): string {
  const page = seoForPath(path)
  const links = INDEXABLE_PATHS
    .map(p => `<li><a href="${p}">${esc(seoForPath(p).breadcrumbs.slice(-1)[0]?.name ?? 'Home')}</a></li>`)
    .join('')
  return `<noscript><h1>${esc(page.heading)}</h1><p>${esc(page.description)}</p><nav><ul>${links}</ul></nav></noscript>`
}

export function renderSitemap(): string {
  const urls = INDEXABLE_PATHS.map(p => `  <url><loc>${canonicalUrl(p)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

// ---------------------------------------------------------------------------
// Runtime: keep tags in sync as the SPA navigates
// ---------------------------------------------------------------------------

/** Updates (or creates) the head element identified by `selector` */
function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function meta(key: 'name' | 'property', name: string, content: string) {
  upsert(`meta[${key}="${name}"]`, () => {
    const el = document.createElement('meta')
    el.setAttribute(key, name)
    return el
  }, 'content', content)
}

export function applySeo(route: RouteLocationNormalized) {
  applyPageSeo(route.path)
}

export interface PageSeoOverrides {
  /** Replaces the path's own tags entirely, e.g. a story's (see storySeo) */
  page?: PageSeo
  /** Replace just the title or description, e.g. a session's once the session list arrives */
  title?: string
  description?: string
  /** Share image; defaults to the site's */
  image?: SeoImage
}

/** Sets every tag for a path, with `overrides` for pages whose details load at runtime */
export function applyPageSeo(path: string, overrides: PageSeoOverrides = {}) {
  const page = overrides.page ?? seoForPath(path)
  const title = overrides.title ?? page.title
  const description = overrides.description ?? page.description
  const { noindex } = page
  const breadcrumbs = overrides.title && page.breadcrumbs.length
    ? [...page.breadcrumbs.slice(0, -1), { ...page.breadcrumbs[page.breadcrumbs.length - 1], name: overrides.title.split(' | ')[0] }]
    : page.breadcrumbs
  const url = canonicalUrl(path)
  const image = overrides.image ?? DEFAULT_SEO_IMAGE

  meta('property', 'og:image', image.url)
  meta('property', 'og:image:width', String(image.width))
  meta('property', 'og:image:height', String(image.height))
  meta('property', 'og:image:alt', image.alt)
  meta('name', 'twitter:image', image.url)

  document.title = title
  meta('name', 'description', description)
  meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:url', url)
  meta('name', 'twitter:title', title)
  meta('name', 'twitter:description', description)
  upsert('link[rel="canonical"]', () => {
    const el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    return el
  }, 'href', url)

  const crumbs = breadcrumbJsonLd(breadcrumbs)
  let script = document.getElementById('seo-breadcrumbs')
  if (!crumbs) {
    script?.remove()
    return
  }
  if (!script) {
    script = document.createElement('script')
    script.id = 'seo-breadcrumbs'
    script.setAttribute('type', 'application/ld+json')
    document.head.appendChild(script)
  }
  script.textContent = crumbs
}
