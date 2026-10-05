// Utilities
import { defineStore } from 'pinia'
import apiClient from '@/api/elysianClient'
import type { PortfolioPhoto } from '@/utils/photoUrls'

/**
 * A session product (edited on the admin Products page, Sessions tab). The
 * Investment page and both booking pages read the same list.
 */
export type BookingSession = {
  productId: number
  /** URL segment: /booking/{slug} */
  slug: string
  title: string
  /** Paragraphs separated by blank lines; the first is the short summary */
  description: string | null
  durationMinutes: number
  price: number | null
  /** Variable pricing: shown as a starting price, e.g. "$400+" */
  isPriceFrom: boolean
  location: string | null
  /** Investment page section, e.g. "Portraits" */
  collection: string
  features: string[]
  /** Portfolio category slug, used for the fallback cover and the Contact form */
  portfolioCategory: string | null
  isBookable: boolean
  sortOrder: number
  coverPhoto: PortfolioPhoto | null
}

type State = {
  sessions: BookingSession[]
  loaded: boolean
  failed: boolean
}

// One in-flight request shared by every caller; the response is HTTP-cached for a few minutes
let loading: Promise<void> | null = null

export const useSessionStore = defineStore('sessions', {
  state: (): State => ({
    sessions: [],
    loaded: false,
    failed: false,
  }),
  getters: {
    bySlug: (state: State) => (slug: string): BookingSession | undefined => state.sessions.find(s => s.slug === slug),
    /** Sessions grouped by collection, in the order collections first appear */
    collections: (state: State): { name: string, sessions: BookingSession[] }[] => {
      const groups = new Map<string, BookingSession[]>()
      for (const session of state.sessions) {
        groups.set(session.collection, [...(groups.get(session.collection) ?? []), session])
      }
      return Array.from(groups, ([name, sessions]) => ({ name, sessions }))
    },
  },
  actions: {
    /** @param fresh Skip the browser's cached copy (the list is cached for a few minutes) */
    load(fresh = false): Promise<void> {
      loading ??= (async () => {
        const response = await apiClient.getData(`/api/booking/sessions${fresh ? `?fresh=${Date.now()}` : ''}`)
        if (response.success && Array.isArray(response.data)) {
          this.sessions = response.data
          this.failed = false
        } else {
          console.error('Failed to load sessions.', response.errorMessage)
          this.failed = true
          loading = null
        }
        this.loaded = true
      })()
      return loading
    },
    /** Re-reads the list past any cached copy, e.g. after an edit on the admin Sessions page */
    reload(): Promise<void> {
      loading = null
      return this.load(true)
    },
  },
})
