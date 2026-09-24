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
      <v-slide-group-item v-for="src in showcase" :key="src">
        <v-img :src="src" :width="imgWidth" aspect-ratio="0.75" cover class="showcase-image"></v-img>
      </v-slide-group-item>
    </v-slide-group>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { portfolioPhoto } from '@/utils/portfolioPhotos'

const { mobile } = useDisplay()
const imgWidth = computed(() => (mobile.value ? 240 : 340))

// The real gallery strip from the live site's homepage, in its original
// order.
const showcase = [
  portfolioPhoto('maternityAnnouncement', 700, 933),
  portfolioPhoto('bridePortrait', 700, 933),
  portfolioPhoto('coupleJump', 700, 933),
  portfolioPhoto('familyLittleBrother', 700, 933),
  portfolioPhoto('coupleCloseUp', 700, 933),
]
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
