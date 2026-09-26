<template>
  <section class="hero py-10 py-md-14">
    <v-container class="text-center mb-8 mb-md-10">
      <span class="font-nav tracking-widest text-caption text-blush hero-eyebrow mb-4">
        Tallahassee &amp; Beyond
      </span>

      <h1 class="font-display text-charcoal hero-name my-2">Aspen Smitha</h1>

      <p class="font-display font-italic text-charcoal hero-tagline mb-8">
        Wedding &middot; Maternity &middot; Family Photography
      </p>

      <v-btn
        variant="outlined"
        color="charcoal"
        size="large"
        rounded="0"
        class="font-nav tracking-wide text-caption"
        to="/portfolio"
      >
        View the Portfolio
      </v-btn>
    </v-container>

    <!-- A wide, edge-to-edge carousel of standout session frames — the
         "hook" for the page, kept well short of a full-viewport hero. -->
    <v-slide-group show-arrows class="hero-showcase">
      <v-slide-group-item v-for="(key, i) in HERO_SHOWCASE_PLACEMENTS" :key="key">
        <ResponsivePhoto
          :photo="photos.forPlacement(key)"
          :sizes="PHOTO_SIZES.showcase"
          :width="imgWidth"
          aspect-ratio="0.75"
          :eager="i < 3"
          class="showcase-image"
        />
      </v-slide-group-item>
    </v-slide-group>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { HERO_SHOWCASE_PLACEMENTS } from '@/utils/sitePlacements'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const { mobile } = useDisplay()
const imgWidth = computed(() => (mobile.value ? 240 : 340))

// The real gallery strip from the live site's homepage, in its original
// order. Only the first few are visible on load, so only those load eagerly.
const photos = usePhotoStore()
</script>

<style scoped>
.hero-eyebrow {
  display: inline-block;
}

.hero-name {
  font-size: clamp(2.5rem, 4vw + 1rem, 4.5rem);
  line-height: 1.05;
  letter-spacing: 0.01em;
}

.hero-tagline {
  font-size: clamp(1.125rem, 1vw + 0.75rem, 1.5rem);
  letter-spacing: 0.02em;
}

.hero-showcase :deep(.v-slide-group__content) {
  gap: 6px;
}

.showcase-image {
  cursor: pointer;
}
</style>
