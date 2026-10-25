<template>
  <section class="story-cta">
    <v-container class="text-center">
      <h2 class="font-heading text-charcoal cta-heading-lg">{{ heading }}</h2>

      <v-btn
        color="sage"
        size="large"
        rounded="0"
        class="font-nav tracking-wide text-caption mt-8"
        :to="{ path: '/contact', query: sessionType ? { type: sessionType } : undefined }"
      >
        Inquire Now
      </v-btn>
    </v-container>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  heading: string
  /** Pre-selects the contact form's session type, e.g. "Weddings" */
  sessionType?: string
}>()
</script>

<style scoped>
.story-cta {
  padding: 64px 0 80px;
  border-top: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}
</style>
