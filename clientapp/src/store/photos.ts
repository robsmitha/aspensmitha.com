// Utilities
import { defineStore } from 'pinia'
import apiClient from '@/api/elysianClient'
import { portfolioCoverKey } from '@/utils/sitePlacements'
import type { PortfolioPhoto } from '@/utils/photoUrls'

type State = {
  photos: PortfolioPhoto[]
  loaded: boolean
}

// One in-flight request shared by every caller; the response itself is
// HTTP-cached (browser + CDN) so repeat visits don't reach the API.
let loading: Promise<void> | null = null

export const usePhotoStore = defineStore('photos', {
  state: (): State => ({
    photos: [],
    loaded: false,
  }),
  getters: {
    /**
     * Photo filling a site spot (see sitePlacements.ts). `undefined` while loading,
     * so callers render an empty frame of the right shape rather than flashing a fallback.
     */
    forPlacement: (state: State) => (key: string): PortfolioPhoto | undefined => {
      if (!state.loaded) return undefined
      return state.photos.find(p => p.placements.includes(key))
    },
    /** Whether any real (uploaded) photo is filed under this category */
    hasUploads: (state: State) => (slug: string): boolean => state.photos.some(p => p.category === slug),
    byCategory: (state: State) => (slug: string): PortfolioPhoto[] | undefined => {
      if (!state.loaded) return undefined
      return state.photos.filter(p => p.category === slug)
    },
    /** Tile cover for a category: its chosen cover photo, else its first photo by sort order */
    coverFor(): (slug: string) => PortfolioPhoto | undefined {
      return (slug: string) => {
        if (!this.loaded) return undefined
        const key = portfolioCoverKey(slug)
        return this.photos.find(p => p.placements.includes(key)) ?? this.byCategory(slug)?.[0]
      }
    },
  },
  actions: {
    load(): Promise<void> {
      loading ??= (async () => {
        const response = await apiClient.getData('/api/portfolio')
        if (response.success && Array.isArray(response.data)) {
          this.photos = response.data
        } else {
          console.error('Failed to load portfolio photos.', response.errorMessage)
          loading = null
        }
        this.loaded = true
      })()
      return loading
    },
  },
})
