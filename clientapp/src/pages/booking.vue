<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <Hero />

  <v-container class="py-14 py-md-20">
    <v-row v-if="!sessions.loaded">
      <v-col v-for="n in 3" :key="n" cols="12" sm="6" md="4">
        <v-skeleton-loader type="image, heading, text@2" color="transparent" />
      </v-col>
    </v-row>

    <div v-else-if="!sessions.sessions.length" class="text-center py-10">
      <p class="font-display text-charcoal empty-note mx-auto mb-6">
        Session details are taking a moment to load. Please refresh, or reach out and I'll help you find a time.
      </p>
      <v-btn color="charcoal" size="large" rounded="0" class="font-nav tracking-wide text-caption" to="/contact">
        Contact
      </v-btn>
    </div>

    <v-row v-else>
      <v-col v-for="session in sessions.sessions" :key="session.slug" cols="12" sm="6" md="4">
        <SessionCard :session="session" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import Hero from '@/components/Booking/Hero.vue'
import SessionCard from '@/components/Booking/SessionCard.vue'
import { useSessionStore } from '@/store/sessions'

const sessions = useSessionStore()
sessions.load()
</script>

<style scoped>
.empty-note {
  font-size: 1.125rem;
  line-height: 1.6;
  max-width: 520px;
}
</style>
