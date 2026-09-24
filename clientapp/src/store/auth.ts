// Utilities
import { defineStore } from 'pinia'
import { ClaimsIdentity } from './types'
import apiClient from '@/api/elysianClient'

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
      const response = await apiClient?.getData('/.auth/me')

      if (!response?.success){
        console.error("Failed to get auth me.")
        return
      }

      const identity: ClaimsIdentity = response.data
      if (identity?.clientPrincipal) {
        this.userDetails = identity.clientPrincipal.userDetails
        
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