<template>
  <v-container class="py-16 py-md-20 text-center">
    <p class="font-display font-italic text-charcoal cta-note mx-auto mb-8">
      For inquiries about events, weddings, or any other questions please go to my contact
      page and submit an inquiry.
    </p>

    <v-btn
      color="charcoal"
      size="large"
      rounded="0"
      class="font-nav tracking-wide text-caption"
      to="/contact"
    >
      Let's book!
    </v-btn>
  </v-container>
</template>

<style scoped>
.cta-note {
  font-size: clamp(1.125rem, 1vw + 0.75rem, 1.375rem);
  line-height: 1.55;
  max-width: 560px;
}
</style>
