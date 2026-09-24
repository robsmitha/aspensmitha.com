// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import Layouts from 'vite-plugin-vue-layouts'
import Vue from '@vitejs/plugin-vue'
import VueRouter from 'unplugin-vue-router/vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import * as fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
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
