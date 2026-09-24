// Utilities
import { defineStore } from 'pinia'
import githubClient from '@/api/githubClient'
import { GithubUser, GithubRepo } from '@/api/githubClient'

type State = {
  user: GithubUser | null,
  repos: GithubRepo[] | null,
  starred: GithubRepo[] | null
}

export const useGithubStore = defineStore('github', {
    state: (): State => ({
      user: null,
      repos: [],
      starred: []
    }),
    getters: {
      repoLookup: (state: State) : Map<string, GithubRepo> => {
        const repoLookup = new Map<string, GithubRepo>();
        if(state.repos){
          for (const repo of state.repos) {
              repoLookup.set(repo.name, repo);
          }
        }
        return repoLookup
      },
    },
    actions: {
      async fetchUser(): Promise<void> {
        const user = await githubClient?.getUser()
        this.user = user;
      },
      async fetchRepos(): Promise<void> {
        const repos = await githubClient?.getUserRepos()
        this.repos = repos;
      },
      async fetchStarred(): Promise<void> {
        const starred = await githubClient?.getStarred()
        this.starred = starred;
      }
    }
  })