// Utilities
import { defineStore } from 'pinia'
import apiClient from '@/api/elysianClient'
import { sessionsByCollection, type BookingSession } from '@robsmitha/elysian-ui/booking'

// A session product (edited in the admin app, under Sessions). The Investment page and both booking pages read
// the same list.
export type { BookingSession }

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
    collections: (state: State) => sessionsByCollection(state.sessions),
  },
  actions: {
    load(): Promise<void> {
      loading ??= (async () => {
        const response = await apiClient.getData('/api/booking/sessions')
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
  },
})
