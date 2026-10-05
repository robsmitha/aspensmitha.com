<template>
  <div class="booking-unavailable text-center py-6 py-md-10 mx-auto">
    <v-icon size="36" color="blush" class="mb-4">mdi-calendar-heart</v-icon>
    <h2 class="font-display text-charcoal unavailable-heading mb-3">{{ heading }}</h2>
    <p class="font-display text-charcoal-light unavailable-copy mx-auto mb-8">
      <slot>
        Online booking is taking a short break right now, but I'd still love to hear from you. Send me a note with the
        dates you have in mind and I'll get back to you with my availability.
      </slot>
    </p>
    <v-btn color="charcoal" size="large" rounded="0" class="font-nav tracking-wide text-caption" :to="contactLink">
      Contact me
    </v-btn>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  contactLink: string
  heading?: string
}>(), {
  heading: "Let's find a time together",
})
</script>

<style scoped>
.booking-unavailable {
  max-width: 560px;
}

.unavailable-heading {
  font-size: clamp(1.75rem, 1.5vw + 1.1rem, 2.25rem);
  line-height: 1.15;
}

.unavailable-copy {
  font-size: 1.0625rem;
  line-height: 1.6;
}
</style>
