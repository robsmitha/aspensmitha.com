<template>
  <router-link :to="`/booking/${session.slug}`" class="session-card-link d-block h-100" :aria-label="`${session.title}: view details and availability`">
    <v-sheet color="surface" border rounded="0" class="session-card d-flex flex-column h-100">
      <ResponsivePhoto :photo="cover" :sizes="PHOTO_SIZES.gallery" aspect-ratio="1.5" :alt="`${session.title} session`" />

      <div class="pa-6 pa-md-7 d-flex flex-column flex-grow-1">
        <span class="font-nav tracking-widest text-caption text-blush text-uppercase">{{ session.collection }}</span>
        <h2 class="font-display text-charcoal session-title mt-1 mb-3">{{ session.title }}</h2>

        <p v-if="summary" class="font-display text-charcoal-light session-description mb-5">{{ summary }}</p>

        <v-divider color="stone-light" opacity="0.6" class="mt-auto mb-4"></v-divider>
        <SessionMeta :session="session" compact :show-location="false" />
      </div>
    </v-sheet>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import SessionMeta from '@/components/Booking/SessionMeta.vue'
import type { BookingSession } from '@/store/sessions'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'
import { paragraphs } from '@/utils/bookingFormat'

const props = defineProps<{
  session: BookingSession
}>()

const photos = usePhotoStore()
const cover = computed(() => props.session.coverPhoto
  ?? (props.session.portfolioCategory ? photos.coverFor(props.session.portfolioCategory) : undefined))
const summary = computed(() => paragraphs(props.session.description).join(' '))
</script>

<style scoped>
.session-card-link {
  text-decoration: none;
  color: inherit;
}

.session-card {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.session-card-link:hover .session-card,
.session-card-link:focus-visible .session-card {
  box-shadow: 0 24px 48px -24px rgba(33, 31, 28, 0.25);
  transform: translateY(-4px);
}

.session-card-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-blush));
  outline-offset: 4px;
}

.session-title {
  font-size: clamp(1.5rem, 1vw + 1.1rem, 1.875rem);
  line-height: 1.15;
}

.session-description {
  font-size: 1.0625rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
