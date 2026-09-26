<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="category">
    <CategoryHero :name="category.name" :description="category.description" />
    <template v-if="showGallery">
      <Gallery v-if="galleryPhotos" :photos="galleryPhotos" />
      <!-- Holds the page height while photo metadata loads -->
      <div v-else class="gallery-pending"></div>
    </template>
    <!-- Categories without a standing gallery (Events) always keep their inquiry prompt -->
    <EventsInquiry v-if="!category.hasGallery" />
  </template>

  <v-container v-else class="py-20 text-center">
    <h1 class="font-display text-charcoal not-found-heading mb-4">Category Not Found</h1>
    <router-link to="/portfolio" class="font-nav tracking-wide text-caption text-charcoal">
      Back to Portfolio
    </router-link>
  </v-container>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CategoryHero from '@/components/Portfolio/CategoryHero.vue'
import Gallery from '@/components/Portfolio/Gallery.vue'
import EventsInquiry from '@/components/Portfolio/EventsInquiry.vue'
import { getPortfolioCategory } from '@/utils/portfolioCategories'
import { usePhotoStore } from '@/store/photos'

const route = useRoute()
const photos = usePhotoStore()
const category = computed(() => getPortfolioCategory(String((route.params as Record<string, string>).category)))
const galleryPhotos = computed(() => category.value && photos.byCategory(category.value.slug))
// Any category with uploaded photos gets a gallery, even one without a placeholder gallery (Events)
const showGallery = computed(() => !!category.value && (category.value.hasGallery || photos.hasUploads(category.value.slug)))
</script>

<style scoped>
.gallery-pending {
  min-height: 100vh;
}

.not-found-heading {
  font-size: 2.5rem;
}
</style>
