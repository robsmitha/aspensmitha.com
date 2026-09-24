<template>
  <v-sheet color="ivory-deep" class="py-14 py-md-18">
    <v-container class="text-center">
      <router-link
        to="/portfolio"
        class="font-nav tracking-wide text-caption text-stone back-link d-inline-flex align-center ga-2 mb-6"
      >
        <v-icon size="14">mdi-arrow-left</v-icon>
        All Categories
      </router-link>

      <h1 class="font-display text-charcoal hero-heading mb-4">{{ name }}</h1>
      <p class="font-display text-stone hero-subtitle mx-auto">{{ description }}</p>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  description: string
}>()
</script>

<style scoped>
.back-link {
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.back-link:hover {
  opacity: 1;
}

.hero-heading {
  font-size: clamp(2.5rem, 4vw + 1rem, 4.5rem);
  line-height: 1.05;
}

.hero-subtitle {
  font-size: clamp(1.0625rem, 0.5vw + 0.875rem, 1.1875rem);
  line-height: 1.6;
  max-width: 480px;
}
</style>
