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
        <v-img
          :src="portfolioPhoto('coupleJump', 1200, 1500)"
          aspect-ratio="0.8"
          cover
          class="portfolio-image"
        ></v-img>
      </v-col>

      <v-col cols="12" md="5" class="d-flex flex-column ga-4 mt-4 mt-md-0">
        <v-img
          :src="portfolioPhoto('coupleCloseUp', 900, 700)"
          aspect-ratio="1.3333"
          cover
          class="portfolio-image flex-grow-1"
        ></v-img>
        <v-img
          :src="portfolioPhoto('maternityAnnouncement', 900, 700)"
          aspect-ratio="1.3333"
          cover
          class="portfolio-image flex-grow-1"
        ></v-img>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { portfolioPhoto } from '@/utils/portfolioPhotos'
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
