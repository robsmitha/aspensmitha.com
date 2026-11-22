/**
 * The site's manifest: what this site says about itself to the shared admin app and the image publisher.
 * The build writes it to dist/_site/manifest.json (see vite.config.mts), and the backend keeps a copy.
 *
 * This repo is the source of truth and the data only flows out. The pages themselves keep using the files
 * this is built from (portfolioCategories.ts, sitePlacements.ts, placementSlots.json) compiled into the
 * build, so nothing here is ever fetched on a visitor's page load.
 *
 * Keep this file free of `@/` imports and `import.meta.env`: vite.config.mts imports it.
 */
import catalog from '../content/placementSlots.json'
import { PORTFOLIO_CATEGORIES } from './portfolioCategories'
import { SITE_NAME, SITE_URL } from './seo'
import { HERO_SHOWCASE_PLACEMENTS, SITE_PAGES, SITE_PLACEMENTS, portfolioCoverKey, type SitePage } from './sitePlacements'

/**
 * One block of a page's wireframe, as the admin app draws it. A block with `spot` stands for that placement
 * key and is highlighted when the spot is selected; the rest are filler that makes the page recognisable.
 */
export type LayoutBlock =
  /** A line of heading or body text */
  | { type: 'text' }
  /** Lines of text beside a photo; "form" draws them as form fields */
  | { type: 'lines', count: number, variant?: 'form' }
  /** A row of small tiles with no photo, e.g. the fact tiles on About */
  | { type: 'tiles', count: number }
  /** A photo. `ratio` is width / height; `flex` is its share of a row; "banner" is a full-width strip */
  | { type: 'spot', spot: string, ratio?: number, flex?: number, shape?: 'banner' }
  /** Blocks side by side; "strip" is a row of many narrow photos */
  | { type: 'row', children: LayoutBlock[], variant?: 'strip' }
  /** Blocks stacked, inside a row */
  | { type: 'col', children: LayoutBlock[] }
  | { type: 'grid', columns: number, children: LayoutBlock[] }

const portrait = (spot: string, flex?: number): LayoutBlock =>
  flex === undefined ? { type: 'spot', spot, ratio: 0.8 } : { type: 'spot', spot, ratio: 0.8, flex }

/**
 * Each page's wireframe, in the order its sections appear. When a section with a photo spot is added to or
 * removed from a page, change it here too. `site` has no layout: it isn't a page.
 */
export const SITE_LAYOUTS: Partial<Record<SitePage, LayoutBlock[]>> = {
  home: [
    { type: 'text' },
    { type: 'row', variant: 'strip', children: HERO_SHOWCASE_PLACEMENTS.map(spot => ({ type: 'spot' as const, spot })) },
    { type: 'row', children: [portrait('home-intro', 0.8), { type: 'lines', count: 3 }] },
    { type: 'row', children: [portrait('home-specialty-weddings'), portrait('home-specialty-maternity'), portrait('home-specialty-family')] },
    {
      type: 'row',
      children: [
        portrait('home-recent-large', 1.4),
        { type: 'col', children: [{ type: 'spot', spot: 'home-recent-top' }, { type: 'spot', spot: 'home-recent-bottom' }] },
      ],
    },
    { type: 'text' },
    { type: 'spot', spot: 'home-cta', shape: 'banner' },
  ],
  about: [
    { type: 'text' },
    { type: 'tiles', count: 3 },
    { type: 'row', children: [portrait('about-story', 0.8), { type: 'lines', count: 4 }] },
    { type: 'spot', spot: 'about-cta', shape: 'banner' },
  ],
  portfolio: [
    { type: 'text' },
    { type: 'grid', columns: 3, children: PORTFOLIO_CATEGORIES.map(c => portrait(portfolioCoverKey(c.slug))) },
  ],
  contact: [
    { type: 'text' },
    { type: 'row', children: [portrait('contact-portrait', 0.8), { type: 'lines', count: 4, variant: 'form' }] },
  ],
}

export function buildSiteManifest() {
  return {
    version: 1,
    site: { name: SITE_NAME, publicUrl: SITE_URL },
    categories: PORTFOLIO_CATEGORIES.map(c => ({
      slug: c.slug,
      name: c.name,
      hasGallery: c.hasGallery,
      hasStories: !!c.stories,
    })),
    pages: (Object.keys(SITE_PAGES) as SitePage[]).map(key => ({
      key,
      name: SITE_PAGES[key].name,
      path: SITE_PAGES[key].path,
      ...(SITE_LAYOUTS[key] ? { layout: SITE_LAYOUTS[key] } : {}),
    })),
    spots: SITE_PLACEMENTS.map(p => ({ key: p.key, label: p.label, page: p.page })),
    placements: {
      recipeVersion: catalog.recipeVersion,
      siteDefaultKey: catalog.siteDefaultKey,
      slots: catalog.slots,
    },
  }
}

/**
 * Fails the build when a wireframe and the list of spots disagree, so the admin app never shows a map with
 * a spot missing from it or one that no longer exists.
 */
export function checkSiteLayouts() {
  const problems: string[] = []
  const spotsIn = (blocks: LayoutBlock[]): string[] => blocks.flatMap(block =>
    block.type === 'spot' ? [block.spot] : 'children' in block ? spotsIn(block.children) : [])

  for (const page of Object.keys(SITE_LAYOUTS) as SitePage[]) {
    const drawn = spotsIn(SITE_LAYOUTS[page] ?? [])
    const listed = SITE_PLACEMENTS.filter(p => p.page === page).map(p => p.key)

    const unknown = drawn.filter(key => !listed.includes(key))
    const missing = listed.filter(key => !drawn.includes(key))
    const twice = drawn.filter((key, i) => drawn.indexOf(key) !== i)

    if (unknown.length) problems.push(`${page} draws ${unknown.join(', ')}, not a spot on that page in sitePlacements.ts`)
    if (missing.length) problems.push(`${page} doesn't draw ${missing.join(', ')}`)
    if (twice.length) problems.push(`${page} draws ${twice.join(', ')} twice`)
  }

  if (problems.length) {
    throw new Error(`Site layouts out of sync with sitePlacements.ts (${problems.join('; ')})`)
  }
}
