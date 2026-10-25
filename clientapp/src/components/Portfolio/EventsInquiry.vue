<template>
  <v-container class="py-14 py-md-18 text-center">
    <!-- Same heading style as the bottom of the story pages -->
    <h2 class="font-heading text-charcoal cta-heading-lg">Let’s plan your event.</h2>

    <v-btn
      color="sage"
      size="large"
      rounded="0"
      class="font-nav tracking-wide text-caption mt-8"
      :to="{ path: '/contact', query: { type: 'Events' } }"
    >
      Inquire Now
    </v-btn>
  </v-container>
</template>
