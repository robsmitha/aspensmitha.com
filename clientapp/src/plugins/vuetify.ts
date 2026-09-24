/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify, type ThemeDefinition } from 'vuetify'

// Dark, near-black developer-portfolio theme with an RGB-keyboard-inspired
// accent treatment in the hero. Custom keys (navy / slate / mono-ink etc.)
// still render as Vuetify utility classes at runtime, e.g. `bg-light-navy`,
// `text-slate`, `border-lightest-navy` — only the hex values shifted from
// navy to neutral near-black greys, so every component that already
// consumes these tokens picks up the new palette automatically.
const portfolio: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0a0a0c',
    surface: '#151517',
    'surface-bright': '#2a2a2e',
    'surface-light': '#1c1c1f',
    'surface-variant': '#2a2a2e',
    primary: '#5e3ba3',
    secondary: '#8a8a93',
    accent: '#5e3ba3',
    error: '#ff6b6b',
    info: '#57cbff',
    success: '#64ffda',
    warning: '#f6c177',

    'on-background': '#eaeaef',
    'on-surface': '#eaeaef',
    'on-primary': '#f5f3ff',
    'on-secondary': '#0a0a0c',

    navy: '#0a0a0c',
    'light-navy': '#151517',
    'lightest-navy': '#2a2a2e',
    slate: '#8a8a93',
    'light-slate': '#aeaeb6',
    'lightest-slate': '#eaeaef',
    green: '#64ffda',
    violet: '#c792ea',
    amber: '#f6c177',
    orange: '#f78c6c',
  },
  variables: {
    'border-color': '#2a2a2e',
    'border-opacity': 1,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.85,
    'disabled-opacity': 0.4,
  },
}

// Light, airy bridal theme for the Aspen Smitha Photography landing page —
// soft near-white paper tones, ink used only for text/line-work (never as a
// section background) and a single dusty-blush accent, in the spirit of a
// wedding studio site rather than an earthy/rustic one. Scoped on to that
// page only via `theme="aspen"` so the rest of the (unrelated, dark) site
// is untouched.
const aspen: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#fdfaf6',
    surface: '#ffffff',
    primary: '#221f1c',
    secondary: '#c48f8a',
    'on-background': '#221f1c',
    'on-surface': '#221f1c',
    'on-primary': '#fdfaf6',

    ivory: '#fdfaf6',
    'ivory-deep': '#f8f2ef',
    charcoal: '#221f1c',
    'charcoal-light': '#3a3733',
    stone: '#948b83',
    'stone-light': '#d8d0c9',
    blush: '#c48f8a',
    'blush-dark': '#a86f6a',
  },
  variables: {
    'border-color': '#221f1c',
    'border-opacity': 0.1,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.8,
  },
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'portfolio',
    themes: { portfolio, aspen },
  },
  defaults: {
    VBtn: {
      rounded: 'sm',
    },
  },
})
