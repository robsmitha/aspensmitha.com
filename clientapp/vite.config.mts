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
  // Matches the bare placeholder (source index.html) or a filled block (built
  // index.html), so the same fill works for both
  const block = (name: string) => new RegExp(`<!--${name}-->(?:[\\s\\S]*?<!--/${name}-->)?`)
  const fill = (html: string, page: string) => html
    .replace(block('seo-head'), () => `<!--seo-head-->\n    ${renderSeoHead(page)}\n    <!--/seo-head-->`)
    .replace(block('seo-body'), () => `<!--seo-body-->${renderSeoBody(page)}<!--/seo-body-->`)

  return {
    name: 'seo-pages',
    configResolved (config) {
      outDir = path.resolve(config.root, config.build.outDir)
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
