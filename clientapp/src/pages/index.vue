<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />
  <Intro />
  <Specialties />
  <InstagramFeed />
  <Testimonial />
  <CallToAction />
</template>

<script lang="ts" setup>
import Hero from '@/components/Landing/Hero.vue'
import Intro from '@/components/Landing/Intro.vue'
import Specialties from '@/components/Landing/Specialties.vue'
import InstagramFeed from '@/components/Landing/InstagramFeed.vue'
import Testimonial from '@/components/Landing/Testimonial.vue'
import CallToAction from '@/components/Landing/CallToAction.vue'
</script>
