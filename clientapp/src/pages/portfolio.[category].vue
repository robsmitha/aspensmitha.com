<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="category">
    <CategoryHero :name="category.name" :description="category.description" />

    <!-- Story categories list their published stories in place of the gallery -->
    <template v-if="category.stories && stories === undefined">
      <div class="gallery-pending"></div>
    </template>
    <StoryList v-else-if="stories?.length" :stories="stories" />
    <template v-else-if="showGallery">
      <Gallery v-if="galleryPhotos" :photos="galleryPhotos" />
      <!-- Holds the page height while photo metadata loads -->
      <div v-else class="gallery-pending"></div>
    </template>

    <!-- Categories without a standing gallery (Events) always keep their inquiry prompt -->
    <EventsInquiry v-if="!category.hasGallery" />
    <BookingCta v-else :category="category" />
  </template>

  <v-container v-else class="py-20 text-center">
    <h1 class="font-heading text-charcoal not-found-heading mb-4">Category Not Found</h1>
    <router-link to="/portfolio" class="font-nav tracking-wide text-caption text-sage">
      Back to Portfolio
    </router-link>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CategoryHero from '@/components/Portfolio/CategoryHero.vue'
import Gallery from '@/components/Portfolio/Gallery.vue'
import EventsInquiry from '@/components/Portfolio/EventsInquiry.vue'
import BookingCta from '@/components/Portfolio/BookingCta.vue'
import StoryList from '@/components/Stories/StoryList.vue'
import { getPortfolioCategory } from '@/utils/portfolioCategories'
import { usePhotoStore } from '@/store/photos'
import { useStoryStore } from '@/store/stories'
import type { StorySummary } from '@/utils/stories'

const route = useRoute()
const photos = usePhotoStore()
// Not a reserved CDN placement, so this still reads /api/portfolio (load() shares one request)
photos.load()
const storyStore = useStoryStore()
const category = computed(() => getPortfolioCategory(String((route.params as Record<string, string>).category)))
const galleryPhotos = computed(() => category.value && photos.byCategory(category.value.slug))
// Only categories with uploaded photos get a gallery; gallery categories hold their space while loading
const showGallery = computed(() => !!category.value &&
  (photos.hasUploads(category.value.slug) || (category.value.hasGallery && !photos.loaded)))

/** undefined while loading; a failed request falls back to the gallery */
const stories = ref<StorySummary[] | null | undefined>()

watch(category, async c => {
  if (!c?.stories) {
    stories.value = null
    return
  }
  stories.value = storyStore.lists[c.slug]
  const list = await storyStore.loadList(c.slug)
  if (category.value?.slug === c.slug) stories.value = list ?? null
}, { immediate: true })
</script>

<style scoped>
.gallery-pending {
  min-height: 100vh;
}

.not-found-heading {
  font-size: 2.5rem;
}
</style>
