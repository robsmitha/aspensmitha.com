<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />
  <!-- <QuickFacts /> -->
  <Story />
  <Cta />
</template>

<script lang="ts" setup>
import Hero from '@/components/About/Hero.vue'
import QuickFacts from '@/components/About/QuickFacts.vue'
import Story from '@/components/About/Story.vue'
import Cta from '@/components/About/Cta.vue'
</script>
