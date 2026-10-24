<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="story && copy">
    <div v-if="previewing" class="preview-banner font-nav tracking-wide text-caption text-center py-2">
      Preview &middot; {{ story.status === 'Draft' ? 'This draft is only visible to you' : `${story.status} story` }}
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
      :body="copy.ctaBody"
      :session-type="category?.name"
      :more-to="`/portfolio/${story.category}`"
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
import { photoUrl, type PortfolioPhoto } from '@/utils/photoUrls'
import { applyPageSeo, storySeo, DEFAULT_SEO_IMAGE } from '@/utils/seo'
import { storyPath, storyPhotoAlt, type Story } from '@/utils/stories'

const route = useRoute()
const router = useRouter()
const stories = useStoryStore()

const params = computed(() => route.params as Record<string, string>)
const category = computed(() => getPortfolioCategory(params.value.category))
/** /admin/stories links here with ?preview=<storyId> so drafts can be checked before publishing */
const previewId = computed(() => (typeof route.query.preview === 'string' ? route.query.preview : null))
const previewing = computed(() => !!previewId.value && !!story.value)

/** undefined while loading, null when not found */
const story = ref<Story | null | undefined>()
const copy = computed(() => (story.value ? getPortfolioCategory(story.value.category)?.stories : undefined))
const heroAlt = computed(() => {
  const s = story.value
  if (!s?.hero) return undefined
  const index = s.photos.findIndex(p => p.id === s.hero!.id)
  return storyPhotoAlt(s, s.hero, Math.max(0, index), s.photos.length)
})

watch([() => params.value.slug, previewId], async ([slug, preview]) => {
  story.value = preview ? undefined : stories.pages[slug]
  const loaded = preview ? await loadPreview(preview) : await stories.loadPage(slug)
  if (params.value.slug !== slug) return

  // The URL's category is cosmetic; send old links to the story's current one
  if (loaded && loaded.category !== params.value.category && !preview) {
    router.replace(storyPath(loaded))
    return
  }
  story.value = loaded
}, { immediate: true })

watch(story, s => {
  if (!s) return
  const hero = s.hero
  const image = hero
    ? {
        url: photoUrl(hero, hero.widths.find(w => w >= 1200) ?? hero.widths[hero.widths.length - 1]),
        width: 1200,
        height: Math.round(1200 * (hero.height / hero.width)),
        alt: hero.altText || s.title,
      }
    : DEFAULT_SEO_IMAGE
  const page = storySeo(s, route.path)
  applyPageSeo(route.path, { page: previewing.value ? { ...page, noindex: true } : page, image })
})

interface ManagedStoryPhoto extends Omit<PortfolioPhoto, 'srcBase' | 'width' | 'height'> {
  srcBase: string | null
  width: number | null
  height: number | null
  status: string
}

/** Signed-in preview of any status, shaped like the public story */
async function loadPreview(storyId: string): Promise<Story | null> {
  const response = await apiClient.getData(`/api/manage/stories/${encodeURIComponent(storyId)}`)
  if (!response.success) return null
  const data = response.data
  const photos = (data.photos as ManagedStoryPhoto[])
    .filter(p => p.status === 'Ready' && p.srcBase)
    .map(p => ({ ...p, srcBase: p.srcBase!, width: p.width ?? 0, height: p.height ?? 0 }))
  return {
    ...data,
    hero: photos.find(p => p.id === data.heroPhotoId) ?? photos[0] ?? null,
    photos,
  }
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
