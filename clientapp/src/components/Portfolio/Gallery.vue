<template>
  <v-container class="py-14 py-md-18">
    <!-- Masonry: photos keep their own shape; see utils/masonry.ts for how they're placed -->
    <div class="masonry">
      <div v-for="(column, c) in columns" :key="c" class="masonry__column">
        <button
          v-for="{ item: photo, index } in column"
          :key="photo.id"
          class="gallery-item"
          :aria-label="`View photo ${index + 1} of ${photos.length}`"
          @click="openLightbox(index)"
        >
          <ResponsivePhoto
            :photo="photo"
            :sizes="PHOTO_SIZES.gallery"
            :aspect-ratio="1 / aspectHeight(photo)"
            class="gallery-image"
          />
        </button>
      </div>
    </div>

    <PhotoLightbox v-model="lightboxOpen" :photos="photos" :index="lightboxIndex" @update:index="lightboxIndex = $event" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import PhotoLightbox from '@/components/Photo/PhotoLightbox.vue'
import { PHOTO_SIZES, type PortfolioPhoto } from '@/utils/photoUrls'
import { aspectHeight, masonryColumns } from '@/utils/masonry'

const props = defineProps<{
  photos: PortfolioPhoto[]
}>()

// Same breakpoints as PHOTO_SIZES.gallery: 1 column on phones, 2 on tablets, 3 above
const { xs, sm } = useDisplay()
const columnCount = computed(() => (xs.value ? 1 : sm.value ? 2 : 3))
const columns = computed(() => masonryColumns(props.photos, columnCount.value))

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(i: number) {
  lightboxIndex.value = i
  lightboxOpen.value = true
}
</script>

<style scoped>
.masonry {
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.masonry__column {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

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
