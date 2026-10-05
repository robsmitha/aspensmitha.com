<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />

  <template v-if="sessions.loaded">
    <PricingSection
      v-for="(collection, index) in sessions.collections"
      :key="collection.name"
      :title="collection.name"
      :tone="index % 2 === 0 ? 'ivory' : 'ivory-deep'"
      :tiers="collection.sessions.map(toTier)"
    />
  </template>

  <!-- Holds the page while session pricing loads -->
  <v-container v-else class="py-14 py-md-20">
    <v-skeleton-loader type="heading, image" color="transparent" class="mb-10" />
    <v-skeleton-loader type="heading, image" color="transparent" />
  </v-container>

  <Cta />
</template>

<script lang="ts" setup>
import Hero from '@/components/Investment/Hero.vue'
import PricingSection, { type PricingTier } from '@/components/Investment/PricingSection.vue'
import Cta from '@/components/Investment/Cta.vue'
import { useSessionStore, type BookingSession } from '@/store/sessions'
import { formatPrice, paragraphs } from '@/utils/bookingFormat'

// Sessions are edited on the admin Products page (Sessions tab) and shared with the booking pages
const sessions = useSessionStore()
sessions.load()

function toTier(session: BookingSession): PricingTier {
  return {
    name: session.title,
    price: formatPrice(session),
    // The first paragraph is the short summary; the booking page shows the rest
    description: paragraphs(session.description)[0],
    features: session.features,
  }
}
</script>
