<template>
  <section class="cta">
    <v-img
      :src="portfolioPhoto('bridePortrait', 1800, 900)"
      cover
      class="cta-image"
    >
      <div class="cta-scrim"></div>

      <div class="cta-content d-flex flex-column align-center justify-center text-center h-100 px-6">
        <v-btn
          color="ivory"
          size="large"
          rounded="0"
          class="font-nav tracking-wide text-caption text-charcoal"
          to="/contact"
        >
          Let's chat!
        </v-btn>
      </div>
    </v-img>
  </section>
</template>

<script setup lang="ts">
import { portfolioPhoto } from '@/utils/portfolioPhotos'
</script>

<style scoped>
.cta-image {
  min-height: 360px;
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
</style>
