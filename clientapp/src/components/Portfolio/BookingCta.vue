<template>
  <v-sheet color="ivory-deep" class="py-16 py-md-20">
    <v-container class="text-center">
      <span class="font-nav tracking-widest text-caption text-blush">LOVE WHAT YOU SEE?</span>

      <!-- Category pages only; the main Portfolio page goes straight to the copy -->
      <h2 v-if="category" class="font-heading text-charcoal cta-heading-lg mt-3" :class="category.hideBookingCopy ? 'mb-8' : 'mb-4'">
        {{ category.bookingHeading ?? "Let's create yours." }}
      </h2>

      <p v-if="!category?.hideBookingCopy" class="font-display text-stone cta-copy mx-auto mb-8" :class="{ 'mt-4': !category }">
        <template v-if="category">
          Book your {{ category.bookingLabel }} today and let's capture the moments you'll want to hold onto.
        </template>
        <template v-else>
          Choose your session, pick a time that works for you, and reserve your photoshoot in just a few steps.
        </template>
      </p>

      <v-btn
        color="sage"
        size="large"
        rounded="0"
        class="font-nav tracking-wide text-caption"
        :to="bookingLink"
        @click="trackClick"
      >
        {{ category?.inquireInstead ? 'Inquire Now' : 'Book Now' }}
      </v-btn>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { event } from 'vue-gtag'
import { useSessionStore } from '@/store/sessions'
import type { PortfolioCategory } from '@/utils/portfolioCategories'

/** Without a category (the main Portfolio page) the message is generic */
const props = defineProps<{
  category?: PortfolioCategory
}>()

const sessions = useSessionStore()
onMounted(() => {
  if (props.category) sessions.load()
})

// Straight to the session when exactly one bookable session matches the category; otherwise the full list
const bookingLink = computed(() => {
  if (!props.category) return '/booking'
  if (props.category.inquireInstead) return { path: '/contact', query: { type: props.category.name } }
  const matches = sessions.sessions.filter(s => s.isBookable && s.portfolioCategory === props.category!.slug)
  return matches.length === 1 ? `/booking/${matches[0].slug}` : '/booking'
})

function trackClick() {
  event('select_content', { content_type: 'portfolio_booking_cta', content_id: props.category?.slug ?? 'portfolio' })
}
</script>

<style scoped>
.cta-copy {
  font-size: clamp(1.0625rem, 0.5vw + 0.875rem, 1.1875rem);
  line-height: 1.6;
  max-width: 520px;
}
</style>
