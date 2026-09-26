<template>
  <v-container class="py-10 py-md-12">
    <v-row justify="center">
      <v-col v-for="fact in facts" :key="fact.label" cols="6" md="3" class="text-center">
        <v-icon color="blush" size="20" class="mb-2">{{ fact.icon }}</v-icon>
        <p class="font-nav tracking-wide text-caption text-stone mb-1">{{ fact.label }}</p>
        <p class="font-display text-charcoal fact-value">{{ fact.value }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const facts = [
  { icon: 'mdi-heart-outline', label: 'Married', value: '5 Years This December' },
  { icon: 'mdi-home-heart', label: 'Role', value: 'Stay-at-Home Mom' },
  { icon: 'mdi-paw-outline', label: 'Pets', value: 'Zeus, Jasper, Athena & Hazel' },
  { icon: 'mdi-map-marker-outline', label: 'Based Near', value: 'Tallahassee, FL' },
]
</script>

<style scoped>
.fact-value {
  font-size: 1.125rem;
}
</style>
