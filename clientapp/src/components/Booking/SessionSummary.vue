<template>
  <!-- Same green header treatment as /booking: the session's details and description, centered -->
  <v-sheet color="ivory-deep" class="py-16 py-md-20">
    <v-container class="text-center">
      <router-link to="/booking" class="d-inline-flex align-center font-nav tracking-wide text-caption text-stone back-link mb-6">
        <v-icon size="14" class="mr-1">mdi-arrow-left</v-icon>
        ALL SESSIONS
      </router-link>

      <!-- <span class="d-block font-nav tracking-widest text-caption text-blush text-uppercase">{{ session.collection }}</span> -->
      <h1 class="font-display text-charcoal summary-title mt-4 mb-4">{{ session.title }}</h1>

      <SessionMeta :session="session" class="justify-center mb-8" />

      <div class="summary-body font-display text-stone mx-auto">
        <div :class="{ 'summary-clamp': !expanded }">
          <p v-for="(paragraph, index) in descriptionParagraphs" :key="index" class="mb-4">{{ paragraph }}</p>
        </div>

        <v-expand-transition>
          <div v-if="expanded">
            <div v-if="session.features.length" class="mt-4 mb-8">
              <h2 class="font-nav tracking-widest text-caption text-charcoal text-uppercase mb-3">What's included</h2>
              <ul class="summary-features">
                <li v-for="feature in session.features" :key="feature" class="d-flex align-start justify-center ga-2 mb-1">
                  <v-icon color="blush" size="16" class="mt-1">mdi-check</v-icon>
                  <span class="font-italic">{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>
        </v-expand-transition>
      </div>

      <button type="button" class="font-nav tracking-wide text-caption text-charcoal read-more" :aria-expanded="expanded" @click="emit('update:expanded', !expanded)">
        {{ expanded ? 'SHOW LESS' : 'READ MORE' }}
        <v-icon size="14" class="ml-1">{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </button>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SessionMeta from '@/components/Booking/SessionMeta.vue'
import type { BookingSession } from '@/store/sessions'
import { paragraphs } from '@/utils/bookingFormat'

const props = defineProps<{
  session: BookingSession
  /** Read more / Show less (v-model:expanded) */
  expanded: boolean
}>()
const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()

const descriptionParagraphs = computed(() => paragraphs(props.session.description))
</script>

<style scoped>
.back-link {
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: rgb(var(--v-theme-charcoal)) !important;
}

/* Matches the /booking header */
.summary-title {
  font-size: clamp(2.5rem, 4vw + 1rem, 4.5rem);
  line-height: 1.05;
}

.summary-body {
  font-size: clamp(1.0625rem, 0.5vw + 0.875rem, 1.1875rem);
  line-height: 1.6;
  max-width: 620px;
}

/* Collapsed: the first few lines of the description */
.summary-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.read-more {
  display: inline-flex;
  align-items: center;
  background: none;
  border: 0;
  padding: 0 0 3px;
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.35);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.read-more:hover {
  border-color: rgb(var(--v-theme-charcoal));
}
</style>
