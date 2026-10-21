// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import * as fs from 'fs';
import * as path from 'node:path'
import { INDEXABLE_PATHS, renderSeoBody, renderSeoHead, renderSitemap } from './src/utils/seo'
import { PLACEMENT_SLOTS, SITE_DEFAULT_PLACEMENT, placementPreloadTag, placementSlot } from './src/utils/placementImages'
import { HERO_PRELOAD, HERO_SHOWCASE_PLACEMENTS, SITE_PLACEMENTS } from './src/utils/sitePlacements'
import { PHOTO_SIZES } from './src/utils/photoUrls'

/**
 * Fills index.html's <!--seo-head--> / <!--seo-body--> placeholders from
 * src/utils/seo.ts, then writes a copy per indexable page (dist/contact.html,
 * dist/portfolio/weddings.html, ...) plus sitemap.xml. Crawlers and link
 * previews that don't run JS get each page's own title, description, canonical
 * and breadcrumbs; staticwebapp.config.json rewrites each route to its file.
 */
/**
 * unplugin-fonts preloads every font file in the bundle, which for the MDI
 * icon font means the eot/woff/ttf fallbacks too (~3MB nobody needs, competing
 * with the hero photos). Every supported browser uses the woff2.
 */
function woff2PreloadsOnly(): Plugin {
  return {
    name: 'woff2-preloads-only',
    transformIndexHtml: {
      order: 'post',
      handler: html => html.replace(/^\s*<link rel="preload" as="font" type="font\/(?!woff2")[^>]*>\r?\n/gm, ''),
    },
  }
}

function seoPages(): Plugin {
  let outDir = 'dist'
  let heroPreload = ''
  // Matches the bare placeholder (source index.html) or a filled block (built
  // index.html), so the same fill works for both
  const block = (name: string) => new RegExp(`<!--${name}-->(?:[\\s\\S]*?<!--/${name}-->)?`)
  // The hero preload goes in the home page's head only: this template also
  // becomes every other page's HTML, and they'd fetch images they never show
  const head = (page: string) => (page === '/' && heroPreload ? `${renderSeoHead(page)}\n    ${heroPreload}` : renderSeoHead(page))
  const fill = (html: string, page: string) => html
    .replace(block('seo-head'), () => `<!--seo-head-->\n    ${head(page)}\n    <!--/seo-head-->`)
    .replace(block('seo-body'), () => `<!--seo-body-->${renderSeoBody(page)}<!--/seo-body-->`)

  return {
    name: 'seo-pages',
    configResolved (config) {
      outDir = path.resolve(config.root, config.build.outDir)
      checkPlacementSlots()
      heroPreload = heroPreloadTags(config.env)
    },
    transformIndexHtml (html) {
      return fill(html, '/')
    },
    closeBundle () {
      const indexPath = path.join(outDir, 'index.html')
      if (!fs.existsSync(indexPath)) return
      const index = fs.readFileSync(indexPath, 'utf-8')
      const swaConfig = JSON.parse(fs.readFileSync(path.resolve(outDir, '../staticwebapp.config.json'), 'utf-8'))
      const rewrites = new Map((swaConfig.routes as { route: string, rewrite?: string }[]).map(r => [r.route, r.rewrite]))

      for (const page of INDEXABLE_PATHS.filter(p => p !== '/')) {
        const file = `${page}.html`
        // Without the rewrite Azure would serve the SPA fallback (home page tags) instead
        if (rewrites.get(page) !== file) {
          throw new Error(`staticwebapp.config.json needs { "route": "${page}", "rewrite": "${file}" }`)
        }
        const target = path.join(outDir, file)
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, fill(index, page))
      }
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), renderSitemap())
    },
  }
}

/**
 * Static preloads for the hero slides on screen at load, so the browser starts
 * them from Cloudflare while it's still parsing the HTML, before any JS. Only
 * when the site uses the fixed CDN URLs (src/utils/placementImages.ts).
 */
function heroPreloadTags (env: Record<string, string>): string {
  const base = env.VITE_PLACEMENT_IMAGE_BASE
  if (env.VITE_PLACEMENT_SOURCE !== 'cdn' || !base) return ''

  return HERO_PRELOAD
    .map(n => placementSlot(HERO_SHOWCASE_PLACEMENTS[n - 1]))
    .filter(slot => slot !== undefined)
    .map((slot, i) => placementPreloadTag(base, slot!, PHOTO_SIZES.showcase, i === 0))
    .join('\n    ')
}

/**
 * src/content/placementSlots.json is what the Function App publishes;
 * sitePlacements.ts is what the admin edits. A Home or Portfolio spot missing
 * from the catalogue would never be published, so fail the build instead.
 */
function checkPlacementSlots () {
  const known = new Set(SITE_PLACEMENTS.map(p => p.key))
  const published = new Set(PLACEMENT_SLOTS.map(s => s.key))
  const unknown = [...published, SITE_DEFAULT_PLACEMENT].filter(key => !known.has(key))
  // Recent Sessions isn't on the live home page (Landing/Portfolio.vue isn't rendered)
  const missing = SITE_PLACEMENTS
    .filter(p => (p.page === 'home' || p.page === 'portfolio') && !p.key.startsWith('home-recent-'))
    .filter(p => !published.has(p.key))
    .map(p => p.key)

  if (unknown.length || missing.length) {
    const problems = [
      unknown.length ? `not a placement in sitePlacements.ts: ${unknown.join(', ')}` : '',
      missing.length ? `missing from placementSlots.json: ${missing.join(', ')}` : '',
    ].filter(Boolean)
    throw new Error(`Placement slots out of sync (${problems.join('; ')})`)
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    seoPages(),
    // Do not pass `layoutsDirs` even though it's just the default ('src/layouts'):
    // vite-plugin-vue-layouts@0.10's canEnableClientLayout() checks for a key named
    // "layoutDirs" (no "s"), so passing the real "layoutsDirs" option always fails
    // that check and forces the heavier server-side layout mode. That mode installs
    // its own configureServer file watcher which intercepts every change under
    // src/layouts/** and routes it through a manual full-reload instead of letting
    // Vite's normal per-component HMR run - which is why editing files like
    // layouts/default/AppBar.vue or Footer.vue silently didn't hot reload. Omitting
    // the option keeps the plugin on its lightweight import.meta.glob-based client
    // layout path, which has no custom watcher and hot reloads normally.
    Layouts({
      defaultLayout: 'default',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    Fonts({
      google: {
        families: [
          {
            name: 'Roboto',
            styles: 'wght@100;300;400;500;700;900',
          },
          {
            name: 'Inter',
            styles: 'wght@300;400;500;600;700;800',
          },
          {
            name: 'JetBrains Mono',
            styles: 'wght@400;500;600;700',
          },
          {
            name: 'Cormorant Garamond',
            styles: 'ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500',
          },
          {
            name: 'Jost',
            styles: 'wght@300;400;500',
          },
        ],
      },
    }),
    woff2PreloadsOnly(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
      ],
      dts: true,
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    // TODO: swa proxy does not like ssl
    // https: {
    //   pfx: fs.readFileSync('localhost.pfx'),
    //   passphrase: 'password'
    // }
  },
})
