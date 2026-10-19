<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />
  <CategoryTiles />
  <BookingCta />
</template>

<script lang="ts" setup>
import Hero from '@/components/Portfolio/Hero.vue'
import CategoryTiles from '@/components/Portfolio/CategoryTiles.vue'
import BookingCta from '@/components/Portfolio/BookingCta.vue'
</script>
