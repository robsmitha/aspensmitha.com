<template>
  <v-container class="py-14 py-md-20">
    <v-row>
      <v-col cols="12" md="5" class="d-flex flex-column contact-aside">
        <ResponsivePhoto
          :photo="photos.forPlacement('contact-portrait')"
          :sizes="PHOTO_SIZES.portrait"
          aspect-ratio="0.8"
          class="contact-image mb-8"
        />

        <div class="contact-aside__text">
          <h2 class="font-heading text-charcoal contact-heading mb-3">Ready to book?</h2>
          <p class="font-display text-stone contact-copy mb-4">
            If you're looking to book a wedding or event, please use this page to inquire about my
            availability. You can also contact me if you are unsure about what session type works
            best for you.
          </p>
          <p class="font-display text-stone contact-copy mb-6">
            Most sessions can be booked online. View session details, check my availability, and
            reserve your photoshoot in just a few steps.
          </p>

          <v-btn
            variant="outlined"
            color="sage"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            to="/booking"
          >
            Check availability
          </v-btn>
        </div>
      </v-col>

      <v-col cols="12" md="6" offset-md="1">
        <ContactForm
          ref="formRef"
          :api="apiClient"
          :turnstile-site-key="TURNSTILE_SITE_KEY"
          :session-types="sessionTypes"
          :contact-email="CONTACT_EMAIL"
          @sent="onSent"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ContactForm from '@robsmitha/elysian-ui/components/ContactForm.vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { event } from 'vue-gtag'
import apiClient from '@/api/elysianClient'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'
import { PORTFOLIO_CATEGORIES } from '@/utils/portfolioCategories'
import { CONTACT_EMAIL } from '@/utils/contact'
import { useSessionStore } from '@/store/sessions'

const photos = usePhotoStore()
// Not a reserved CDN placement, so this still reads /api/portfolio (load() shares one request)
photos.load()

// Couples stays as is; every other category reads as one session ("Wedding", not "Weddings")
const SINGULAR_SESSION_TYPES: Record<string, string> = {
  Engagements: 'Engagement',
  Weddings: 'Wedding',
  Seniors: 'Senior',
  Grads: 'Grad',
  Events: 'Event',
}
const sessionTypeFor = (categoryName: string) => SINGULAR_SESSION_TYPES[categoryName] ?? categoryName
const sessionTypes = PORTFOLIO_CATEGORIES.map(category => sessionTypeFor(category.name))

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

const route = useRoute()
const formRef = ref<InstanceType<typeof ContactForm>>()

onMounted(async () => {
  // Story pages link here with ?type=Weddings (a session type) to pre-select it.
  // Accepts the category name ("Weddings") or the dropdown wording ("Wedding").
  const requestedType = route.query.type
  if (typeof requestedType === 'string') {
    formRef.value?.prefill({ sessionType: sessionTypeFor(requestedType) })
  }

  // Booking pages link here as /contact?session={slug} when no time works; start the inquiry for that session
  const slug = route.query.session
  if (typeof slug !== 'string' || !slug) return

  const sessions = useSessionStore()
  await sessions.load()
  const session = sessions.bySlug(slug)
  if (!session) return

  const category = PORTFOLIO_CATEGORIES.find(c => c.slug === session.portfolioCategory)
  // Leaves the form alone if the visitor has already chosen or typed something
  formRef.value?.prefill({
    sessionType: category ? sessionTypeFor(category.name) : undefined,
    otherSessionType: category ? undefined : session.title,
    message: `I'm interested in the ${session.title} session, but I couldn't find a time that works on the booking calendar. Here's when I'm available: `,
  })
})

function onSent({ sessionType }: { sessionType: string }) {
  // GA4 recommended lead event; mark it as a key event in GA to count inquiries as conversions
  event('generate_lead', { lead_source: 'contact_form', session_type: sessionType })
}
</script>

<style scoped>
.contact-image {
  /* Stops growing with the column on big screens */
  width: 100%;
  max-width: 500px;
  box-shadow: 0 24px 60px -20px rgba(33, 31, 28, 0.3);
}

.contact-aside__text {
  width: 100%;
  max-width: 500px;
}

/* Side by side: photo and copy hug the form side of the column, sharing a
   left edge, instead of leaving a wide gap on big screens */
@media (min-width: 960px) {
  .contact-aside {
    align-items: flex-end;
  }
}

.contact-heading {
  font-size: clamp(1.5rem, 1.5vw + 1rem, 1.875rem);
  line-height: 1.15;
}

.contact-copy {
  font-size: 1.0625rem;
  line-height: 1.6;
  max-width: 420px;
}

.contact-email {
  font-size: 1.0625rem;
  text-decoration: none;
  width: fit-content;
  border-bottom: 1px solid rgba(var(--v-theme-sage), 0.4);
  transition: border-color 0.2s ease;
}

.contact-email:hover {
  border-color: rgb(var(--v-theme-sage));
}
</style>
