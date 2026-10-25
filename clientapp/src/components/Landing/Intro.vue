<template>
  <v-container class="py-16 py-md-16">
    <v-row align="center">
      <v-col cols="12" md="5" order="2" order-md="1" class="mt-10 mt-md-0">
        <PlacementPhoto
          placement="home-intro"
          :sizes="PHOTO_SIZES.portrait"
          class="intro-portrait"
        />
      </v-col>

      <v-col cols="12" md="6" offset-md="1" order="1" order-md="2">
        <h2 class="font-heading text-charcoal intro-heading mb-4">Hello, I'm Aspen.</h2>

        <div class="intro-quote">
          <v-icon color="blush" size="28" class="d-flex mb-3">mdi-format-quote-open</v-icon>
          <p class="font-display font-italic text-charcoal intro-copy mb-4">
            I’m here to capture life’s fleeting, unrepeatable moments: the way he looks at her,
            the hand resting on a growing belly, a child’s laugh caught midair.
          </p>
          <p class="font-display font-italic text-charcoal intro-copy mb-0">
            Whether you’re a couple wanting your first photos together, parents-to-be,
            celebrating a graduation, saying “I do,” or simply wanting photos for your wall,
            I’m here for you.
          </p>
        </div>

        <router-link to="/about-me" class="font-nav tracking-wide text-caption text-sage intro-link d-inline-flex align-center ga-2 mt-8">
          Learn more about me
          <v-icon size="16">mdi-arrow-right</v-icon>
        </router-link>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import PlacementPhoto from '@/components/Photo/PlacementPhoto.vue'
import { PHOTO_SIZES } from '@/utils/photoUrls'
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

.intro-link {
  text-decoration: none;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(var(--v-theme-sage), 0.4);
  transition: border-color 0.2s ease;
}

.intro-link:hover {
  border-color: rgb(var(--v-theme-sage));
}
</style>
