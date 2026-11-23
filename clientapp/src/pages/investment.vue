<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />

  <template v-if="sessions.loaded">
    <PricingSection
      v-for="collection in sessions.collections"
      :key="collection.name"
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
import { formatPrice, paragraphs, type BookingSession } from '@robsmitha/elysian-ui/booking'
import { useSessionStore } from '@/store/sessions'

// Sessions are edited in the admin app (Sessions) and shared with the booking pages
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
