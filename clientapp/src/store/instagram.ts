// Utilities
import { defineStore } from 'pinia'
import apiClient from '@/api/elysianClient'

export const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/aspensmitha.photography'
export const INSTAGRAM_HANDLE = '@aspensmitha.photography'

/**
 * A post mirrored from Instagram. Thumbnails use the portfolio's layout
 * (`{srcBase}/{width}.webp` per entry in `widths`), so it renders with ResponsivePhoto.
 */
export type InstagramPost = {
  id: string
  /** Permalink to the post on instagram.com */
  url: string
  caption: string | null
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string
  postedAt: string | null
  width: number
  height: number
  placeholder: string | null
  srcBase: string
  widths: number[]
}

type State = {
  posts: InstagramPost[]
  loaded: boolean
}

// One in-flight request shared by every caller; the API serves posts from
// the database mirror, so Instagram outages never reach the page.
let loading: Promise<void> | null = null

export const useInstagramStore = defineStore('instagram', {
  state: (): State => ({
    posts: [],
    loaded: false,
  }),
  actions: {
    load(): Promise<void> {
      loading ??= (async () => {
        const response = await apiClient.getData('/api/instagram/posts')
        if (response.success && Array.isArray(response.data)) {
          this.posts = response.data
        } else {
          console.error('Failed to load Instagram posts.', response.errorMessage)
          loading = null
        }
        this.loaded = true
      })()
      return loading
    },
  },
})
