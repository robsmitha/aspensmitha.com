<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="session">
    <SessionSummary v-model:expanded="descriptionExpanded" :session="session" sessions-link="/booking" />

    <v-container class="py-10 py-md-14">
      <div class="booking-column mx-auto">
        <BookingFlow
          :api="apiClient"
          :session="session"
          :turnstile-site-key="TURNSTILE_SITE_KEY"
          :contact-link="contactLink"
          sessions-link="/booking"
          :contact-email="CONTACT_EMAIL"
          :next-steps="NEXT_STEPS"
          @booked="onBooked"
        />
      </div>
    </v-container>
  </template>

  <v-container v-else-if="sessions.loaded" class="py-20 text-center">
    <h1 class="font-heading text-charcoal not-found-heading mb-4">Session Not Found</h1>
    <router-link to="/booking" class="font-nav tracking-wide text-caption text-sage">
      Back to all sessions
    </router-link>
  </v-container>

  <v-container v-else class="py-20">
    <v-skeleton-loader type="image, article" color="transparent" />
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { event } from 'vue-gtag'
import BookingFlow from '@robsmitha/elysian-ui/components/BookingFlow.vue'
import SessionSummary from '@robsmitha/elysian-ui/components/SessionSummary.vue'
import { paragraphs } from '@robsmitha/elysian-ui/booking'
import apiClient from '@/api/elysianClient'
import { useSessionStore } from '@/store/sessions'
import { CONTACT_EMAIL } from '@/utils/contact'
import { applyPageSeo, SITE_NAME } from '@/utils/seo'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

/** What Aspen tells a client to expect once their time is held */
const NEXT_STEPS = [
  "I'll reach out within a day or two to collect your deposit, which confirms your session.",
  'The remaining balance is due by the end of your session.',
  'Your edited gallery arrives within 10\u201314 days, in a private online gallery.',
]

const route = useRoute()
const sessions = useSessionStore()
sessions.load()

const slug = computed(() => String((route.params as Record<string, string>).slug))
const session = computed(() => sessions.bySlug(slug.value))
const contactLink = computed(() => `/contact?session=${encodeURIComponent(slug.value)}`)

const descriptionExpanded = ref(false)

watch(session, (value, previous) => {
  if (!value || value.slug === previous?.slug) return
  // The session list comes from the API, so its title and summary replace the generic booking tags
  applyPageSeo(route.path, {
    title: `${value.title} (${value.collection}) | Book a Session | ${SITE_NAME}`,
    description: paragraphs(value.description)[0],
  })
}, { immediate: true })

function onBooked() {
  event('generate_lead', { lead_source: 'booking', session_type: slug.value })
}
</script>

<style scoped>
.booking-column {
  max-width: 960px;
}

.not-found-heading {
  font-size: 2.5rem;
}
</style>
