<template>
  <v-sheet color="ivory-deep" class="py-14 py-md-18">
    <v-container class="text-center">
      <div class="text-left mb-6">
        <router-link
          to="/portfolio"
          class="font-nav tracking-wide text-caption text-sage back-link d-inline-flex align-center ga-2"
        >
          <v-icon size="14">mdi-arrow-left</v-icon>
          All Categories
        </router-link>
      </div>

      <h1 class="font-heading text-charcoal hero-heading">{{ name }}</h1>
      <span class="heading-rule heading-rule--page mb-6" aria-hidden="true"></span>
      <p class="font-nav text-stone hero-subtitle mx-auto" :class="{ 'hero-subtitle--long': description.length > 80 }">{{ description }}</p>
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

/* Nav-bar font, kept on one line; shrinks with the screen so it fits on phones */
.hero-subtitle {
  font-size: clamp(0.6875rem, 2.4vw, 1rem);
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* A full paragraph (e.g. Creative) wraps in a readable column instead */
.hero-subtitle--long {
  font-size: clamp(0.875rem, 0.3vw + 0.8rem, 1rem);
  line-height: 1.7;
  max-width: 640px;
  white-space: normal;
}
</style>
