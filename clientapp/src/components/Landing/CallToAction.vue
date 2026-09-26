<template>
  <section class="cta">
    <ResponsivePhoto
      :photo="photos.forPlacement('home-cta')"
      :sizes="PHOTO_SIZES.fullBleed"
      aspect-ratio="2.2"
      class="cta-image"
    >
      <div class="cta-scrim"></div>

      <div class="cta-content d-flex flex-column align-center justify-center text-center h-100 px-6">
        <span class="font-nav tracking-widest text-caption text-ivory cta-text-shadow mb-4">Let's Work Together</span>

        <h2 class="font-display text-ivory cta-heading cta-text-shadow mb-8">
          Let's create something<br class="d-none d-sm-block" /> beautiful together.
        </h2>

        <v-btn
          color="ivory"
          size="large"
          rounded="0"
          class="font-nav tracking-wide text-caption text-charcoal"
          to="/contact"
        >
          Inquire Now
        </v-btn>
      </div>
    </ResponsivePhoto>
  </section>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()
</script>

<style scoped>
/* Explicit aspect-ratio above gives this its normal shape; the clamp here
   is just a hard backstop so it can never grow taller than the viewport on
   an unusual screen size or a differently-shaped photo. */
.cta-image {
  min-height: 400px;
  max-height: 85vh;
}

.cta-scrim {
  position: absolute;
  inset: 0;
  background: rgba(40, 32, 28, 0.42);
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-text-shadow {
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
}

.cta-heading {
  font-size: clamp(2rem, 3vw + 1rem, 3.25rem);
  line-height: 1.2;
}
</style>
