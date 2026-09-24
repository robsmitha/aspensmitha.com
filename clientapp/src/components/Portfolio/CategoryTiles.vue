<template>
  <v-container class="py-14 py-md-20">
    <v-row>
      <v-col
        v-for="category in categories"
        :key="category.slug"
        cols="6"
        md="3"
      >
        <router-link :to="`/portfolio/${category.slug}`" class="text-decoration-none">
          <div class="category-tile">
            <v-img
              :src="wixImage(category.images[0], 700, 875)"
              aspect-ratio="0.8"
              cover
              class="category-tile-image"
            ></v-img>
            <div class="category-tile-scrim"></div>
            <div class="category-tile-content">
              <h2 class="font-display text-ivory category-tile-name">{{ category.name }}</h2>
              <span class="font-nav tracking-wide text-caption text-ivory category-tile-cta">
                View Gallery
                <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
              </span>
            </div>
          </div>
        </router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { PORTFOLIO_CATEGORIES } from '@/utils/portfolioCategories'
import { wixImage } from '@/utils/portfolioPhotos'

const categories = PORTFOLIO_CATEGORIES
</script>

<style scoped>
.category-tile {
  position: relative;
  overflow: hidden;
}

.category-tile-image {
  transition: transform 0.6s ease;
}

.category-tile-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(33, 31, 28, 0) 45%, rgba(33, 31, 28, 0.72) 100%);
  transition: background 0.4s ease;
}

.category-tile-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.25rem;
}

.category-tile-name {
  font-size: clamp(1.375rem, 1vw + 1rem, 1.75rem);
  line-height: 1.1;
}

.category-tile-cta {
  display: inline-flex;
  align-items: center;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.category-tile:hover .category-tile-image {
  transform: scale(1.06);
}

.category-tile:hover .category-tile-scrim {
  background: linear-gradient(180deg, rgba(33, 31, 28, 0.1) 30%, rgba(33, 31, 28, 0.8) 100%);
}

.category-tile:hover .category-tile-cta {
  opacity: 1;
  transform: translateY(0);
}
</style>
