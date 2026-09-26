<template>
  <v-container class="py-16 py-md-16">
    <v-row align="end" justify="space-between" class="mb-10 mb-md-12">
      <v-col cols="12" md="7">
        <span class="font-nav tracking-widest text-caption text-blush">Selected Work</span>
        <h2 class="font-display text-charcoal portfolio-heading mt-4">Recent Sessions</h2>
      </v-col>

      <v-col cols="12" md="auto" class="mt-6 mt-md-0">
        <router-link
          to="/portfolio"
          class="font-nav tracking-wide text-caption text-charcoal portfolio-link d-inline-flex align-center ga-2"
        >
          View Full Portfolio
          <v-icon size="16">mdi-arrow-right</v-icon>
        </router-link>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="7">
        <ResponsivePhoto
          :photo="photos.forPlacement('home-recent-large')"
          :sizes="PHOTO_SIZES.sevenTwelfths"
          aspect-ratio="0.8"
          class="portfolio-image"
        />
      </v-col>

      <v-col cols="12" md="5" class="d-flex flex-column ga-4 mt-4 mt-md-0">
        <ResponsivePhoto
          :photo="photos.forPlacement('home-recent-top')"
          :sizes="PHOTO_SIZES.fiveTwelfths"
          aspect-ratio="1.3333"
          class="portfolio-image flex-grow-1"
        />
        <ResponsivePhoto
          :photo="photos.forPlacement('home-recent-bottom')"
          :sizes="PHOTO_SIZES.fiveTwelfths"
          aspect-ratio="1.3333"
          class="portfolio-image flex-grow-1"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()
</script>

<style scoped>
.portfolio-heading {
  font-size: clamp(2.25rem, 2.5vw + 1.25rem, 3rem);
}

.portfolio-link {
  text-decoration: none;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.35);
  transition: border-color 0.2s ease;
}

.portfolio-link:hover {
  border-color: rgb(var(--v-theme-charcoal));
}

.portfolio-image {
  transition: transform 0.6s ease;
}

.portfolio-image:hover {
  transform: scale(1.015);
}
</style>
