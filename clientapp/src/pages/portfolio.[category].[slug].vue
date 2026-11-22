<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="story && copy">
    <div v-if="previewing" class="preview-banner font-nav tracking-wide text-caption text-center py-2">
      Preview &middot; {{ story.status === 'Draft' ? 'This draft is not public' : `${story.status} story` }}
    </div>

    <StoryHero
      :story="story"
      :photo="story.hero"
      :photo-alt="heroAlt"
      :eyebrow="copy.eyebrow"
      :back="{ to: `/portfolio/${story.category}`, label: copy.backLabel }"
    />

    <!-- Hairline between the hero and the photos, with the count as a quiet caption -->
    <v-container v-if="story.photos.length" class="story-divider" role="presentation">
      <span class="story-divider__line"></span>
      <span class="font-nav tracking-widest text-caption text-uppercase text-charcoal-light story-divider__label">
        {{ story.photos.length }} Photograph{{ story.photos.length === 1 ? '' : 's' }}
      </span>
      <span class="story-divider__line"></span>
    </v-container>

    <Gallery
      v-if="story.photos.length"
      class="story-gallery"
      :photos="story.photos"
      :alt-for="(photo, i) => storyPhotoAlt(story!, photo, i, story!.photos.length)"
    />

    <StoryCallToAction
      :heading="copy.ctaHeading"
      :session-type="category?.name"
    />
  </template>

  <!-- Holds the page while the story loads -->
  <div v-else-if="story === undefined" class="story-pending"></div>

  <v-container v-else class="py-20 text-center">
    <h1 class="font-heading text-charcoal not-found-heading mb-4">Story Not Found</h1>
    <p class="text-charcoal-light mb-6">This story may have moved or isn&rsquo;t published yet.</p>
    <router-link
      :to="category?.stories ? `/portfolio/${category.slug}` : '/portfolio'"
      class="font-nav tracking-wide text-caption text-sage"
    >
      {{ category?.stories ? `See ${category.stories.backLabel}` : 'Back to Portfolio' }}
    </router-link>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Gallery from '@/components/Portfolio/Gallery.vue'
import StoryHero from '@/components/Stories/StoryHero.vue'
import StoryCallToAction from '@/components/Stories/StoryCallToAction.vue'
import apiClient from '@/api/elysianClient'
import { useStoryStore } from '@/store/stories'
import { getPortfolioCategory } from '@/utils/portfolioCategories'
import { applyPageSeo, storySeo } from '@/utils/seo'
import { storyPath, storyPhotoAlt, type Story } from '@/utils/stories'
import { forgetPreviewToken, previewTokenFor } from '@/utils/storyPreview'

const route = useRoute()
const router = useRouter()
const stories = useStoryStore()

const params = computed(() => route.params as Record<string, string>)
const category = computed(() => getPortfolioCategory(params.value.category))
/**
 * The admin app opens this page with a short-lived preview token so a draft can be checked before publishing.
 * The router has already taken it out of the address and kept it for this tab (utils/storyPreview.ts).
 */
const previewToken = ref<string | null>(null)
const previewing = computed(() => !!previewToken.value && !!story.value)

/** undefined while loading, null when not found */
const story = ref<Story | null | undefined>()
const copy = computed(() => (story.value ? getPortfolioCategory(story.value.category)?.stories : undefined))
const heroAlt = computed(() => {
  const s = story.value
  if (!s?.hero) return undefined
  const index = s.photos.findIndex(p => p.id === s.hero!.id)
  return storyPhotoAlt(s, s.hero, Math.max(0, index), s.photos.length)
})

watch(() => params.value.slug, async slug => {
  const path = route.path
  let preview = previewTokenFor(path)
  previewToken.value = preview
  story.value = preview ? undefined : stories.pages[slug]

  let loaded = preview ? await loadPreview(preview) : await stories.loadPage(slug)
  if (preview && !loaded) {
    // The link has expired. Show what the public sees: the story if it has been published, else not found.
    forgetPreviewToken(path)
    preview = null
    loaded = await stories.loadPage(slug)
  }
  if (params.value.slug !== slug) return
  previewToken.value = preview

  // The URL's category is cosmetic; send old links to the story's current one
  if (loaded && loaded.category !== params.value.category && !preview) {
    router.replace(storyPath(loaded))
    return
  }
  story.value = loaded
}, { immediate: true })

watch(story, s => {
  if (!s) return
  const page = storySeo(s, route.path)
  applyPageSeo(route.path, { page: previewing.value ? { ...page, noindex: true } : page })
})

/** The story in any status, for whoever holds an unexpired preview token. Shaped like the public story. */
async function loadPreview(token: string): Promise<Story | null> {
  const response = await apiClient.postData('/api/story-preview', { token })
  return response.success ? response.data : null
}
</script>

<style scoped>
.story-pending {
  min-height: 100vh;
}

.story-divider {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 56px;
  padding-bottom: 0;
}

.story-divider__line {
  flex: 1 1 0;
  height: 1px;
  background-color: rgba(var(--v-theme-charcoal), 0.15);
}

.story-divider__label {
  flex-shrink: 0;
  font-size: 0.6875rem !important;
}

/* The divider already spaces the gallery from the hero */
.story-gallery {
  padding-top: 40px !important;
}

.preview-banner {
  background-color: rgb(var(--v-theme-charcoal));
  color: rgb(var(--v-theme-ivory));
}

.not-found-heading {
  font-size: 2.5rem;
}
</style>
