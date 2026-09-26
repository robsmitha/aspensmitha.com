<template>
  <v-container class="py-14 py-md-18">
    <v-row>
      <v-col v-for="photo in photos" :key="photo.id" cols="12" sm="6" md="4">
        <ResponsivePhoto
          :photo="photo"
          :sizes="PHOTO_SIZES.gallery"
          aspect-ratio="0.8"
          class="gallery-image"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { PHOTO_SIZES, type PortfolioPhoto } from '@/utils/photoUrls'

defineProps<{
  photos: PortfolioPhoto[]
}>()
</script>

<style scoped>
.gallery-image {
  transition: transform 0.5s ease;
}

.gallery-image:hover {
  transform: translateY(-4px);
}
</style>
