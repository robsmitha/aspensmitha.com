<template>
  <v-sheet color="ivory-deep" class="py-16 py-md-20">
    <v-container class="text-center">
      <span class="font-nav tracking-widest text-caption text-blush">Booking</span>
      <h1 class="font-display text-charcoal hero-heading mt-4 mb-4">Book Your Session</h1>
      <p class="font-display text-stone hero-subtitle mx-auto mb-6">
        Browse the sessions below to see what's included, check my availability, and reserve your date in just a few
        steps. Dreaming up something a little different, like a custom package, a special location, or a request that
        doesn't quite fit a box? I'd love to hear about it. Just reach out and we'll create something that's perfectly you.
      </p>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
</script>

<style scoped>
.hero-heading {
  font-size: clamp(2.5rem, 4vw + 1rem, 4.5rem);
  line-height: 1.05;
}

.hero-subtitle {
  font-size: clamp(1.0625rem, 0.5vw + 0.875rem, 1.1875rem);
  line-height: 1.6;
  max-width: 620px;
}

.hero-email {
  font-size: 0.9375rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.35);
  transition: border-color 0.2s ease;
}

.hero-email:hover {
  border-color: rgb(var(--v-theme-charcoal));
}
</style>
