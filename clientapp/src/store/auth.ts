// Utilities
import { defineStore } from 'pinia'
import apiClient from '@/api/elysianClient'
import { currentUser } from '@/auth'

type State = {
  userDetails: string | undefined,
  hasGitHubAccessToken: boolean | undefined
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    userDetails: undefined,
    hasGitHubAccessToken: undefined
  }),
  getters: {
    // auth
    signedIn: (state: State) => state.userDetails !== undefined,
    hasValidAccessToken: (state: State) => Boolean(state.hasGitHubAccessToken)
  },
  actions: {
    async fetchAuth(): Promise<void> {
      const userDetails = await currentUser()
      if (userDetails) {
        this.userDetails = userDetails

        const tokenResponse = await apiClient?.getData('/api/GitHubAuthMe')
        if (tokenResponse?.success){
          this.hasGitHubAccessToken = tokenResponse.data.HasGitHubOAuthToken
        } else{
          console.error("Failed to check GitHub OAuth token.")
        }
      }
    },
    async requestGitHubAccessToken(code: string, state: string | undefined): Promise<void> {
      const response = await apiClient?.postData('/api/GitHubOAuthCallback', { code, state })

      if (!response?.success){
        console.error("Could not get github access token")
        this.hasGitHubAccessToken = undefined
      }

      this.hasGitHubAccessToken = response?.data.HasGitHubOAuthToken
    }
  }
})