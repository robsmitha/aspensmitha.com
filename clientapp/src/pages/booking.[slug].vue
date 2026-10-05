<route lang="yaml">
meta:
  layout: landing
</route>

<template>
  <template v-if="session">
    <SessionSummary v-model:expanded="descriptionExpanded" :session="session" />

    <v-container class="py-10 py-md-14">
      <div class="booking-column mx-auto">
        <div v-if="confirmation" ref="confirmationAnchor" class="form-anchor">
          <BookingConfirmation :booking="confirmation" />
        </div>

        <v-sheet v-else-if="!session.isBookable" color="surface" border rounded="0" class="pa-6 pa-md-10">
          <BookingUnavailable :contact-link="contactLink" heading="Let's plan this one together">
            This session is booked by inquiry. Send me a note with your date and a few details, and I'll put together
            everything you need.
          </BookingUnavailable>
        </v-sheet>

        <v-sheet v-else-if="unavailable" color="surface" border rounded="0" class="pa-6 pa-md-10">
          <BookingUnavailable :contact-link="contactLink" />
        </v-sheet>

        <template v-else>
          <v-sheet ref="calendarCard" color="surface" border rounded="0" class="calendar-card pa-6 pa-sm-8 pa-md-10">
            <span class="d-block font-nav tracking-widest text-caption text-blush mb-1">AVAILABILITY</span>
            <h2 class="font-display text-charcoal calendar-heading mb-6">Choose a date &amp; time</h2>

            <v-alert
              v-if="conflictMessage"
              type="warning"
              variant="tonal"
              rounded="0"
              density="compact"
              closable
              class="font-display mb-6"
              @click:close="conflictMessage = ''"
            >
              {{ conflictMessage }}
            </v-alert>

            <v-row>
              <v-col cols="12" md="6" class="pr-md-8">
                <BookingCalendar
                  v-model:month="viewMonth"
                  v-model:year="viewYear"
                  :available-dates="availableDates"
                  :selected="selectedDate"
                  :min="today"
                  :max="lastBookableDate"
                  :loading="loadingMonths > 0"
                  @select="selectDate"
                />
              </v-col>

              <v-col cols="12" md="6" class="pl-md-8 slots-column">
                <v-skeleton-loader v-if="!initialized" type="heading, text, button@6" color="transparent" />
                <TimeSlots
                  v-else
                  :date="selectedDate ? parseDateKey(selectedDate) : null"
                  :slots="selectedSlots"
                  :selected="selectedTime"
                  :contact-link="contactLink"
                  :loading="loadingMonths > 0"
                  @select="selectTime"
                />
              </v-col>
            </v-row>
          </v-sheet>

          <div v-if="selectedStart" ref="formAnchor" class="form-anchor mt-8 mt-md-10">
            <BookingForm
              :key="selectedTime ?? ''"
              :session="session"
              :start="selectedStart"
              @booked="onBooked"
              @conflict="onConflict"
              @unavailable="unavailable = true"
            />
          </div>
        </template>
      </div>
    </v-container>
  </template>

  <v-container v-else-if="sessions.loaded" class="py-20 text-center">
    <h1 class="font-display text-charcoal not-found-heading mb-4">Session Not Found</h1>
    <router-link to="/booking" class="font-nav tracking-wide text-caption text-charcoal">
      Back to all sessions
    </router-link>
  </v-container>

  <v-container v-else class="py-20">
    <v-skeleton-loader type="image, article" color="transparent" />
  </v-container>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/api/elysianClient'
import SessionSummary from '@/components/Booking/SessionSummary.vue'
import BookingCalendar from '@/components/Booking/BookingCalendar.vue'
import TimeSlots from '@/components/Booking/TimeSlots.vue'
import BookingForm, { type BookingConfirmation as Confirmation } from '@/components/Booking/BookingForm.vue'
import BookingConfirmation from '@/components/Booking/BookingConfirmation.vue'
import BookingUnavailable from '@/components/Booking/BookingUnavailable.vue'
import { useSessionStore } from '@/store/sessions'
import { applyPageSeo, SITE_NAME } from '@/utils/seo'
import { dateKey, paragraphs, parseDateKey } from '@/utils/bookingFormat'

type Availability = {
  slug: string
  timeZone: string
  durationMinutes: number
  firstBookableDate: string
  lastBookableDate: string
  days: { date: string, slots: string[] }[]
}

/** Months fetched ahead looking for the first open date (the horizon is 3 months) */
const MAX_MONTHS_AHEAD = 4

const route = useRoute()
const sessions = useSessionStore()
sessions.load()

const slug = computed(() => String((route.params as Record<string, string>).slug))
const session = computed(() => sessions.bySlug(slug.value))
const contactLink = computed(() => `/contact?session=${encodeURIComponent(slug.value)}`)

const descriptionExpanded = ref(false)
const unavailable = ref(false)
const conflictMessage = ref('')
const confirmation = ref<Confirmation | null>(null)
const initialized = ref(false)

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
const viewMonth = ref(today.getMonth())
const viewYear = ref(today.getFullYear())
const lastBookableDate = ref(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()))

/** Open times by the visitor's own dates, merged across every month fetched */
const slotsByDate = ref(new Map<string, Date[]>())
const fetchedMonths = new Map<string, Promise<void>>()
const loadingMonths = ref(0)

const selectedDate = ref<string | null>(null)
const selectedTime = ref<string | null>(null)

const calendarCard = ref<{ $el: HTMLElement }>()
const formAnchor = ref<HTMLElement>()
const confirmationAnchor = ref<HTMLElement>()

const availableDates = computed(() => new Set(Array.from(slotsByDate.value).filter(([, slots]) => slots.length).map(([key]) => key)))
const selectedSlots = computed(() => selectedDate.value ? slotsByDate.value.get(selectedDate.value) ?? [] : [])
const selectedStart = computed(() => selectedTime.value ? new Date(selectedTime.value) : null)

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Loads a month's times once. The server answers in the photographer's dates (with a day either side),
 * so times are regrouped by the visitor's local dates here.
 */
function fetchMonth(year: number, month: number): Promise<void> {
  const key = monthKey(year, month)
  let request = fetchedMonths.get(key)
  if (!request) {
    request = (async () => {
      loadingMonths.value++
      const response = await apiClient.getData(`/api/booking/sessions/${encodeURIComponent(slug.value)}/availability?month=${key}`)
      loadingMonths.value--

      if (!response.success) {
        fetchedMonths.delete(key)
        if (response.statusCode === 503) unavailable.value = true
        return
      }

      const availability = response.data as Availability
      lastBookableDate.value = parseDateKey(availability.lastBookableDate)

      const merged = new Map(slotsByDate.value)
      // Replace this month's dates so a refresh drops times that were booked
      for (const [date] of merged) {
        if (date.startsWith(key)) merged.delete(date)
      }
      for (const day of availability.days) {
        for (const iso of day.slots) {
          const start = new Date(iso)
          const local = dateKey(start)
          const existing = merged.get(local) ?? []
          if (!existing.some(s => s.getTime() === start.getTime())) {
            merged.set(local, [...existing, start].sort((a, b) => a.getTime() - b.getTime()))
          }
        }
      }
      slotsByDate.value = merged
    })()
    fetchedMonths.set(key, request)
  }
  return request
}

function firstAvailableIn(year: number, month: number): string | null {
  const prefix = monthKey(year, month)
  return Array.from(availableDates.value).filter(d => d.startsWith(prefix)).sort()[0] ?? null
}

/** On load: show and select the first date with an open time */
async function initialize() {
  initialized.value = false
  let year = today.getFullYear()
  let month = today.getMonth()
  for (let i = 0; i <= MAX_MONTHS_AHEAD && !unavailable.value; i++) {
    await fetchMonth(year, month)
    const first = firstAvailableIn(year, month)
    if (first) {
      viewYear.value = year
      viewMonth.value = month
      selectedDate.value = first
      break
    }
    month = (month + 1) % 12
    if (month === 0) year++
  }
  initialized.value = true
}

watch(session, (value, previous) => {
  if (!value || value.slug === previous?.slug) return
  // The session list comes from the API, so its title and summary replace the generic booking tags
  applyPageSeo(route.path, {
    title: `${value.title} (${value.collection}) | Book a Session | ${SITE_NAME}`,
    description: paragraphs(value.description)[0],
  })
  if (value.isBookable) initialize()
}, { immediate: true })

// Paging months: load it, and keep a selection on the shown month
watch([viewYear, viewMonth], async ([year, month]) => {
  if (!initialized.value) return
  await fetchMonth(year, month)
  if (!selectedDate.value?.startsWith(monthKey(year, month))) {
    selectDate(firstAvailableIn(year, month))
  }
})

function selectDate(key: string | null) {
  if (key === selectedDate.value) return
  selectedDate.value = key
  selectedTime.value = null
}

async function selectTime(iso: string) {
  selectedTime.value = iso
  conflictMessage.value = ''
  await nextTick()
  formAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onBooked(result: Confirmation) {
  confirmation.value = result
  // The confirmation replaces the calendar and form the client scrolled down to, so bring it into view
  nextTick(() => confirmationAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

/** Someone else got there first: refresh the times and send the client back to choosing */
async function onConflict(message: string) {
  conflictMessage.value = message
  const takenDate = selectedDate.value
  selectedTime.value = null

  const shown = monthKey(viewYear.value, viewMonth.value)
  fetchedMonths.delete(shown)
  if (takenDate && !takenDate.startsWith(shown)) fetchedMonths.delete(takenDate.slice(0, 7))
  await fetchMonth(viewYear.value, viewMonth.value)
  if (takenDate && !takenDate.startsWith(shown)) {
    const [year, month] = takenDate.split('-').map(Number)
    await fetchMonth(year, month - 1)
  }
  if (selectedDate.value && !availableDates.value.has(selectedDate.value)) {
    selectedDate.value = firstAvailableIn(viewYear.value, viewMonth.value)
  }

  await nextTick()
  calendarCard.value?.$el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

</script>

<style scoped>
.booking-column {
  max-width: 960px;
}

.calendar-card {
  box-shadow: 0 24px 48px -24px rgba(33, 31, 28, 0.25);
  scroll-margin-top: 24px;
}

.calendar-heading {
  font-size: clamp(1.75rem, 1.5vw + 1.1rem, 2.25rem);
  line-height: 1.15;
}

@media (min-width: 960px) {
  .slots-column {
    border-left: 1px solid rgba(var(--v-theme-charcoal), 0.08);
  }
}

.form-anchor {
  scroll-margin-top: 24px;
}

.not-found-heading {
  font-size: 2.5rem;
}
</style>
