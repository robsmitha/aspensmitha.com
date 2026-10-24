<template>
  <section class="story-cta">
    <v-container class="text-center">
      <h2 class="font-heading text-charcoal story-cta__heading">{{ heading }}</h2>
      <p class="text-charcoal-light story-cta__body mx-auto">{{ body }}</p>

      <div class="d-flex flex-wrap justify-center ga-4 mt-8">
        <v-btn
          variant="outlined"
          color="sage"
          size="large"
          rounded="0"
          class="font-nav tracking-wide text-caption"
          :to="{ path: '/contact', query: sessionType ? { type: sessionType } : undefined }"
        >
          Check My Date
        </v-btn>
        <v-btn
          variant="text"
          color="sage"
          size="large"
          rounded="0"
          class="font-nav tracking-wide text-caption story-cta__more"
          :to="moreTo"
        >
          More Stories
        </v-btn>
      </div>
    </v-container>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  heading: string
  body: string
  /** Pre-selects the contact form's session type, e.g. "Weddings" */
  sessionType?: string
  moreTo: string
}>()
</script>

<style scoped>
.story-cta {
  padding: 96px 0 112px;
  border-top: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}

.story-cta__heading {
  font-size: clamp(2.25rem, 3vw + 1rem, 3.5rem);
  font-weight: 400;
  line-height: 1.1;
  text-wrap: balance;
}

.story-cta__body {
  margin: 16px 0 0;
  max-width: 520px;
  font-size: 1.0625rem;
  line-height: 1.7;
}

.story-cta__more {
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
