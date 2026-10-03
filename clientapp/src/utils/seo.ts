import type { RouteLocationNormalized } from 'vue-router'
import { getPortfolioCategory } from './portfolioCategories'

/**
 * Per-route <title>, description, canonical and social tags. index.html holds
 * the home page defaults (and the JSON-LD); this keeps them in sync as the SPA
 * navigates so crawlers that render JS see the right values for each page.
 */
const SITE_URL = 'https://www.aspensmitha.com'
const SITE_NAME = 'Aspen Smitha Photography'

interface PageSeo {
  title: string
  description: string
  /** Keep private/utility pages out of search results */
  noindex?: boolean
}

const HOME: PageSeo = {
  title: `Tallahassee Wedding, Maternity & Family Photographer | ${SITE_NAME}`,
  description: 'Aspen Smitha Photography is a wedding, maternity, family and portrait photographer based in Tallahassee, Florida, serving North Florida and beyond.',
}

const PAGES: Record<string, PageSeo> = {
  '/': HOME,
  '/portfolio': {
    title: `Portfolio | ${SITE_NAME}`,
    description: 'Wedding, engagement, couples, maternity, family, senior and graduation photography by Aspen Smitha, a Tallahassee, Florida photographer.',
  },
  '/about-me': {
    title: `About Aspen | ${SITE_NAME}`,
    description: 'Meet Aspen Smitha, a Tallahassee, Florida photographer capturing weddings, growing families and the milestones in between.',
  },
  '/investment': {
    title: `Investment & Pricing | ${SITE_NAME}`,
    description: 'Session and wedding collection pricing for Aspen Smitha Photography in Tallahassee, Florida.',
  },
  '/contact': {
    title: `Contact | ${SITE_NAME}`,
    description: 'Get in touch with Aspen Smitha Photography to check availability for your wedding, maternity, family or portrait session in Tallahassee, Florida.',
  },
}

function seoFor(route: RouteLocationNormalized): PageSeo {
  if (route.path.startsWith('/portfolio/')) {
    const category = getPortfolioCategory(String((route.params as Record<string, string>).category))
    if (category) {
      return {
        title: `Tallahassee ${category.name} Photography | ${SITE_NAME}`,
        description: `${category.description} ${category.name} photography by Aspen Smitha in Tallahassee, Florida.`,
      }
    }
    return { title: `Not Found | ${SITE_NAME}`, description: HOME.description, noindex: true }
  }
  return PAGES[route.path] ?? { title: SITE_NAME, description: HOME.description, noindex: true }
}

/** Updates (or creates) a <meta>/<link> tag identified by `selector` */
function setTag(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

function meta(key: 'name' | 'property', name: string, content: string) {
  setTag(`meta[${key}="${name}"]`, () => {
    const el = document.createElement('meta')
    el.setAttribute(key, name)
    return el
  }, 'content', content)
}

export function applySeo(route: RouteLocationNormalized) {
  const { title, description, noindex } = seoFor(route)
  // Trailing slash only on the root, matching the sitemap
  const url = SITE_URL + (route.path === '/' ? '/' : route.path.replace(/\/$/, ''))

  document.title = title
  meta('name', 'description', description)
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:url', url)
  meta('name', 'twitter:title', title)
  meta('name', 'twitter:description', description)
  meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
  setTag('link[rel="canonical"]', () => {
    const el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    return el
  }, 'href', url)
}
