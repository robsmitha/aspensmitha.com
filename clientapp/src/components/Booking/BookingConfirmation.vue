<template>
  <v-sheet color="surface" border rounded="0" class="booking-confirmation pa-8 pa-md-12 text-center mx-auto" role="status">
    <v-icon size="40" color="blush" class="mb-4">mdi-check-circle-outline</v-icon>
    <span class="d-block font-nav tracking-widest text-caption text-blush">REQUEST RECEIVED</span>
    <h2 class="font-display text-charcoal confirmation-heading mt-2 mb-4">Thank you, {{ firstName }}!</h2>
    <p class="font-display text-charcoal confirmation-copy mx-auto mb-8">
      Your <strong class="font-weight-medium">{{ booking.title }}</strong> session is being held for
      <strong class="font-weight-medium">{{ formatLongDate(start) }} at {{ formatTime(start) }}</strong>
      ({{ timeZoneLabel(start) }}). I'll follow up at {{ booking.email }}.
    </p>

    <div class="confirmation-next text-left mx-auto mb-10">
      <h3 class="font-nav tracking-widest text-caption text-stone mb-4">WHAT HAPPENS NEXT</h3>
      <ol class="font-display text-charcoal">
        <li>I'll reach out within a day or two to collect your deposit, which confirms your session.</li>
        <li>The remaining balance is due by the end of your session.</li>
        <li>Your edited gallery arrives within 10&ndash;14 days, in a private online gallery.</li>
      </ol>
    </div>

    <div class="d-flex flex-wrap justify-center ga-3">
      <v-btn color="charcoal" size="large" rounded="0" class="font-nav tracking-wide text-caption" to="/booking">
        Back to sessions
      </v-btn>
      <v-btn variant="outlined" color="charcoal" size="large" rounded="0" class="font-nav tracking-wide text-caption" to="/contact">
        Questions? Contact
      </v-btn>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BookingConfirmation } from '@/components/Booking/BookingForm.vue'
import { formatLongDate, formatTime, timeZoneLabel } from '@/utils/bookingFormat'

const props = defineProps<{
  booking: BookingConfirmation
}>()

const start = computed(() => new Date(props.booking.start))
const firstName = computed(() => props.booking.name.trim().split(/\s+/)[0])
</script>

<style scoped>
.booking-confirmation {
  max-width: 760px;
  box-shadow: 0 24px 48px -24px rgba(33, 31, 28, 0.25);
}

.confirmation-heading {
  font-size: clamp(2rem, 2vw + 1.25rem, 2.75rem);
  line-height: 1.1;
}

.confirmation-copy {
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 560px;
}

.confirmation-next {
  max-width: 520px;
}

.confirmation-next ol {
  padding-left: 1.25rem;
  font-size: 1.0625rem;
  line-height: 1.6;
}

.confirmation-next li {
  margin-bottom: 0.5rem;
}
</style>
