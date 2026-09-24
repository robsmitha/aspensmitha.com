// Utilities
import { defineStore } from 'pinia'
import { WpPage, WpPost, WpTag, WpCategory } from './types'
import apiClient from '@/api/elysianClient'

type State = {
  pages: PageContent[],
  posts: WpPost[],
  tags: WpTag[],
  categories: WpCategory[]
}

type PageContent = {
  title: string,
  content: string,
  slug: string
}

export const useAppStore = defineStore('app', {
  state: (): State => ({
    pages: defaultState.pages,
    posts: [],
    tags: [],
    categories: defaultState.categories
  }),
  getters: {
    // pages
    homePage: (state: State) => state.pages.find((page) => page.slug === 'home-page'),
    aboutPage: (state: State) => state.pages.find((page) => page.slug === 'about-page'),

    // posts
    summaryPost: (state: State) => state.posts.find((post) => post.slug === 'summary'),
    experiencePost: (state: State) => state.posts.find((post) => post.slug === 'professional-experience-achievements'),
    educationPost: (state: State) => state.posts.find((post) => post.slug === 'education-certification'),

    // tags
    summaryPostTags: (state: State) => {
      const summary = state.posts.find((post) => post.slug === 'summary');
      return state.tags.filter(t => summary?.tags.includes(t.id));
    },
    educationPostTags: (state: State) => {
      const summary = state.posts.find((post) => post.slug === 'education-certification');
      return state.tags.filter(t => summary?.tags.includes(t.id));
    },
    tagsByPost: (state: State) : Map<string, WpTag[]> => {
      const languages = state.posts.find((post) => post.slug === 'languages');
      const frontend = state.posts.find((post) => post.slug === 'frontend');
      const backend = state.posts.find((post) => post.slug === 'backend');
      const tools = state.posts.find((post) => post.slug === 'tools');

      const map = new Map<string, WpTag[]>();
      [languages, frontend, backend, tools].forEach((post) => {
        post && map.set(post.slug, state.tags.filter(t => post.tags.includes(t.id)))
      });
      return map;
    },
    groupedCategories: (state: State) : Map<number, WpCategory[]> => {
      const categoryMap = new Map<number, WpCategory[]>();
      state.categories.forEach(category => {
        const parentId = category.parent;
        if (parentId === 0 && !categoryMap.has(category.id)) {
          categoryMap.set(category.id, []);
        } else if (categoryMap.has(parentId)) {
          categoryMap.get(parentId)?.push(category);
        } else {
            categoryMap.set(parentId, [category]);
        }
      })
      
      return categoryMap;
    },
    parentCategories: (state: State) : Set<WpCategory> => {
      return new Set(state.categories.filter(c => c.parent === 0))
    }
  },
  actions: {
    async fetchContent(): Promise<void> {
      const response = await apiClient?.getData('/api/WordPressContent')
      this.pages = response.data.pages.map((p : WpPage) => {
        return {
          title: p.title.rendered,
          content: p.content.rendered,
          slug: p.slug
        }
      })
      this.posts = response?.data.posts
      this.tags = response?.data.tags
      this.categories = response?.data.categories
    }
  }
})


const defaultState: State = {
  pages: [
    {
      title: 'About',
      slug: 'home-page',
      content: '\n<p>I was born and raised near Tampa, Florida and studied Computer Science at Florida State. During that time, I discovered a passion for creating websites, so I decided to pursue a path building on the web.</p>\n\n\n\n<div style="height:30px" aria-hidden="true" class="wp-block-spacer"></div>\n\n\n\n<p>I graduated from FSU in 2018 and met my wife in 2019. Together, we welcomed our son into the world alongside our beloved pets: Zeus, Athena, and our charming French bulldog, Hazel. When I&#8217;m not building software, I enjoy bothering the pets, working on house projects, grilling red meat, and occasionally catching some fish.</p>\n'
    }
  ],
  tags: [],
  posts: [],
  categories: [
    // Frontend
    {
      id: 100,
      name: 'Frontend',
      description: '',
      parent: 0,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 101,
      name: 'Vue JS',
      description: 'language:vue',
      parent: 100,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 102,
      name: 'React',
      description: 'React language:javascript',
      parent: 100,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 103,
      name: 'MVC',
      description: 'extension:cshtml',
      parent: 100,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    // Backend
    {
      id: 200,
      name: 'Backend',
      description: '',
      parent: 0,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 201,
      name: 'REST APIs',
      description: 'ApiController language:csharp',
      parent: 200,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 202,
      name: 'Function App',
      description: 'functions language:csharp',
      parent: 200,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    // Design patterns
    {
      id: 301,
      name: 'Design Patterns',
      description: '',
      parent: 0,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 302,
      name: 'CQRS',
      description: 'MediatR language:csharp',
      parent: 301,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
    {
      id: 302,
      name: 'MultiTenant',
      description: 'Finbuckle language:csharp',
      parent: 301,
      count: undefined,
      link: undefined,
      slug: undefined,
      taxonomy: undefined,
      meta: undefined,
      _links: undefined
    },
  ]
}