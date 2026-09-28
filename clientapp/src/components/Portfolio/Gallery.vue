<template>
  <v-container class="py-14 py-md-18">
    <v-row>
      <v-col v-for="(photo, i) in photos" :key="photo.id" cols="12" sm="6" md="4">
        <button
          class="gallery-item"
          :aria-label="`View photo ${i + 1} of ${photos.length}`"
          @click="openLightbox(i)"
        >
          <ResponsivePhoto
            :photo="photo"
            :sizes="PHOTO_SIZES.gallery"
            aspect-ratio="0.8"
            class="gallery-image"
          />
        </button>
      </v-col>
    </v-row>

    <PhotoLightbox v-model="lightboxOpen" :photos="photos" :index="lightboxIndex" @update:index="lightboxIndex = $event" />
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import PhotoLightbox from '@/components/Photo/PhotoLightbox.vue'
import { PHOTO_SIZES, type PortfolioPhoto } from '@/utils/photoUrls'

defineProps<{
  photos: PortfolioPhoto[]
}>()

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(i: number) {
  lightboxIndex.value = i
  lightboxOpen.value = true
}
</script>

<style scoped>
.gallery-item {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: inherit;
}

.gallery-image {
  transition: transform 0.5s ease;
}

.gallery-item:hover .gallery-image {
  transform: translateY(-4px);
}
</style>
