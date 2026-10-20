import { defineStore } from 'pinia'
import apiClient from '@/api/elysianClient'
import type { Story, StorySummary } from '@/utils/stories'

type State = {
  /** Published stories per category, newest first */
  lists: Record<string, StorySummary[]>
  /** Story pages by slug */
  pages: Record<string, Story>
}

// One in-flight request per list/page shared by every caller; responses are
// HTTP-cached (browser + CDN) like /api/portfolio
const listRequests = new Map<string, Promise<StorySummary[] | null>>()
const pageRequests = new Map<string, Promise<Story | null>>()

export const useStoryStore = defineStore('stories', {
  state: (): State => ({
    lists: {},
    pages: {},
  }),
  actions: {
    /** Null when the request failed */
    loadList(category: string): Promise<StorySummary[] | null> {
      if (this.lists[category]) return Promise.resolve(this.lists[category])
      let request = listRequests.get(category)
      if (!request) {
        request = (async () => {
          const response = await apiClient.getData(`/api/stories?category=${encodeURIComponent(category)}`)
          listRequests.delete(category)
          if (!response.success || !Array.isArray(response.data)) {
            console.error('Failed to load stories.', response.errorMessage)
            return null
          }
          this.lists[category] = response.data
          return response.data
        })()
        listRequests.set(category, request)
      }
      return request
    },

    /** Null when there's no such story (or it's a draft) or the request failed */
    loadPage(slug: string): Promise<Story | null> {
      if (this.pages[slug]) return Promise.resolve(this.pages[slug])
      let request = pageRequests.get(slug)
      if (!request) {
        request = (async () => {
          const response = await apiClient.getData(`/api/stories/${encodeURIComponent(slug)}`)
          pageRequests.delete(slug)
          if (!response.success) {
            if (response.statusCode !== 404) console.error('Failed to load story.', response.errorMessage)
            return null
          }
          this.pages[slug] = response.data
          return response.data
        })()
        pageRequests.set(slug, request)
      }
      return request
    },
  },
})
