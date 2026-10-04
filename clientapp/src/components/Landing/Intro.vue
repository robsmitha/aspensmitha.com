<template>
  <v-container class="py-16 py-md-16">
    <v-row align="center">
      <v-col cols="12" md="5" order="2" order-md="1" class="mt-10 mt-md-0">
        <ResponsivePhoto
          :photo="photos.forPlacement('home-intro')"
          :sizes="PHOTO_SIZES.portrait"
          aspect-ratio="0.8"
          class="intro-portrait"
        />
      </v-col>

      <v-col cols="12" md="6" offset-md="1" order="1" order-md="2">
        <span class="font-nav tracking-widest text-caption text-blush">The Photographer</span>

        <h2 class="font-display text-charcoal intro-heading my-4">Hello, I'm Aspen.</h2>

        <div class="intro-quote">
          <v-icon color="blush" size="28" class="d-flex mb-3">mdi-format-quote-open</v-icon>
          <p class="font-display font-italic text-charcoal intro-copy mb-0">
            I'm here to capture life's fleeting, unrepeatable moments — the way he looks at her,
            the hand resting on a growing belly, a child's laugh caught mid-air. Take a tour,
            stay awhile, and let's make something beautiful together.
          </p>
        </div>

        <p class="font-nav tracking-wide text-caption text-stone intro-list-label mt-8 mb-4">
          Every session is crafted to
        </p>

        <div class="intro-list">
          <div v-for="point in points" :key="point" class="d-flex align-start ga-3 mb-3">
            <v-icon color="blush" size="14" class="intro-list-mark">mdi-check</v-icon>
            <span class="font-display text-charcoal intro-list-copy">{{ point }}</span>
          </div>
        </div>

        <router-link to="/about-me" class="font-nav tracking-wide text-caption text-charcoal intro-link d-inline-flex align-center ga-2 mt-4">
          Learn more about me
          <v-icon size="16">mdi-arrow-right</v-icon>
        </router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()

const points = [
  'Reflect your authentic self and personality',
  'Tell a captivating story',
  'Elicit emotions such as joy, love, and nostalgia',
]
</script>

<style scoped>
.intro-portrait {
  /* Stops growing with the column on big screens; centered when stacked */
  max-width: 500px;
  margin-inline: auto;
  box-shadow: 0 24px 60px -20px rgba(33, 31, 28, 0.35);
}

/* Side by side: hug the text column instead of floating in the gutter */
@media (min-width: 960px) {
  .intro-portrait {
    margin-right: 0;
  }
}

.intro-heading {
  font-size: clamp(2.5rem, 3vw + 1.5rem, 3.5rem);
  line-height: 1.05;
}

.intro-quote {
  max-width: 560px;
  padding-left: 4px;
  border-left: 2px solid rgba(var(--v-theme-blush), 0.4);
}

.intro-copy {
  font-size: clamp(1.25rem, 1vw + 1rem, 1.5rem);
  line-height: 1.55;
  padding-left: 20px;
}

.intro-list-label {
  font-style: italic;
}

.intro-list-mark {
  margin-top: 6px;
}

.intro-list-copy {
  font-size: 1.125rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

.intro-link {
  text-decoration: none;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.35);
  transition: border-color 0.2s ease;
}

.intro-link:hover {
  border-color: rgb(var(--v-theme-charcoal));
}
</style>
