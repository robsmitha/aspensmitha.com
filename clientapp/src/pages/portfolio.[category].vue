<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="category">
    <CategoryHero :name="category.name" :description="category.description" />
    <Gallery v-if="category.hasGallery" :images="category.images" />
    <EventsInquiry v-else />
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

const route = useRoute()
const category = computed(() => getPortfolioCategory(String((route.params as Record<string, string>).category)))
</script>

<style scoped>
.not-found-heading {
  font-size: 2.5rem;
}
</style>
