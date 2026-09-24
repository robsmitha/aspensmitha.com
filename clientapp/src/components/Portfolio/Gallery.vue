<template>
  <v-container class="py-14 py-md-18">
    <v-row>
      <v-col v-for="id in images" :key="id" cols="12" sm="6" md="4">
        <v-img
          :src="wixImage(id, 700, 875)"
          aspect-ratio="0.8"
          cover
          class="gallery-image"
        ></v-img>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { wixImage } from '@/utils/portfolioPhotos'

defineProps<{
  images: string[]
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
