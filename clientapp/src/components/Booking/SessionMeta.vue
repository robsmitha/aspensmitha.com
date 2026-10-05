<template>
  <ul class="session-meta d-flex flex-wrap align-center font-nav text-stone" :class="{ 'session-meta--compact': compact }">
    <li class="d-flex align-center">
      <v-icon size="16" color="blush" class="mr-1">mdi-clock-outline</v-icon>
      <span>{{ formatDuration(session.durationMinutes) }}</span>
    </li>
    <li class="d-flex align-center">
      <v-icon size="16" color="blush" class="mr-1">mdi-currency-usd</v-icon>
      <span>{{ formatPrice(session).replace('$', '') }}</span>
    </li>
    <li v-if="showLocation && session.location" class="d-flex align-center session-meta__location">
      <v-icon size="16" color="blush" class="mr-1">mdi-map-marker-outline</v-icon>
      <span class="text-truncate" :title="session.location">{{ session.location }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { BookingSession } from '@/store/sessions'
import { formatDuration, formatPrice } from '@/utils/bookingFormat'

withDefaults(defineProps<{
  session: BookingSession
  /** Single line with the location truncated */
  compact?: boolean
  /** The session page shows the location; the cards leave it for there */
  showLocation?: boolean
}>(), {
  compact: false,
  showLocation: true,
})
</script>

<style scoped>
.session-meta {
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 0.5rem 1.25rem;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
}

.session-meta--compact {
  flex-wrap: nowrap !important;
}

.session-meta__location {
  min-width: 0;
}

.session-meta--compact .session-meta__location {
  flex: 1 1 auto;
}
</style>
