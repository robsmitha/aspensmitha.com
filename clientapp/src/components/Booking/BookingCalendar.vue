<template>
  <div class="booking-calendar">
    <v-progress-linear :active="loading" indeterminate color="blush" height="2" class="mb-1" />

    <!-- Vuetify's date picker parts: its month controls, and its weekday row and day grid. Each day is drawn
         below so available, selected and today read the way the booking design needs. (VDatePicker itself
         doesn't pass the day slot through in this Vuetify version.) -->
    <v-date-picker-controls
      :text="monthLabel"
      :disabled="disabledControls"
      class="booking-calendar__controls"
      @click:prev="step(-1)"
      @click:next="step(1)"
    />

    <v-date-picker-month
      :model-value="selectedDate ? [selectedDate] : []"
      :month="month"
      :year="year"
      :min="min"
      :max="max"
      :allowed-dates="isAvailable"
      color="charcoal"
      class="booking-calendar__month"
    >
      <template #day="{ item }">
        <div class="booking-calendar__day">
          <v-btn
            :variant="dayVariant(item)"
            :color="dayColor(item)"
            :disabled="!isAvailable(item.date)"
            :ripple="false"
            :aria-label="ariaLabel(item)"
            :aria-pressed="isSelected(item.date)"
            rounded="0"
            flat
            class="booking-calendar__day-btn font-nav"
            @click="emit('select', dateKey(item.date))"
          >
            {{ item.localized }}
          </v-btn>
          <span v-if="item.isToday" class="booking-calendar__today" aria-hidden="true"></span>
        </div>
      </template>
    </v-date-picker-month>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { dateKey, parseDateKey } from '@/utils/bookingFormat'

const props = defineProps<{
  /** Local date keys ("2026-10-18") with at least one open time */
  availableDates: Set<string>
  selected: string | null
  /** Shown month, 0-11 (v-model:month) */
  month: number
  /** Shown year (v-model:year) */
  year: number
  /** Earliest month that can be shown (prev arrow disabled before it) */
  min: Date
  /** Last bookable day (next arrow disabled after its month) */
  max: Date
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [dateKey: string]
  'update:month': [month: number]
  'update:year': [year: number]
}>()

type DayItem = { date: Date, isToday: boolean, localized: string }

const selectedDate = computed(() => props.selected ? parseDateKey(props.selected) : undefined)

const monthLabel = computed(() => new Date(props.year, props.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))

/** No earlier than the current month, no later than the booking horizon; the month/year views stay off */
const disabledControls = computed(() => {
  const shown = props.year * 12 + props.month
  const disabled = ['mode']
  if (shown <= props.min.getFullYear() * 12 + props.min.getMonth()) disabled.push('prev')
  if (shown >= props.max.getFullYear() * 12 + props.max.getMonth()) disabled.push('next')
  return disabled
})

function step(months: number) {
  const target = new Date(props.year, props.month + months, 1)
  if (target.getFullYear() !== props.year) emit('update:year', target.getFullYear())
  emit('update:month', target.getMonth())
}

function isAvailable(value: unknown): boolean {
  return value instanceof Date && props.availableDates.has(dateKey(value))
}

function isSelected(date: Date): boolean {
  return props.selected === dateKey(date)
}

/** Selected: solid; open: shaded tile; everything else: plain muted text */
function dayVariant(item: DayItem) {
  if (isSelected(item.date) && isAvailable(item.date)) return 'flat'
  return isAvailable(item.date) ? 'flat' : 'text'
}

function dayColor(item: DayItem) {
  if (isSelected(item.date) && isAvailable(item.date)) return 'charcoal'
  return isAvailable(item.date) ? 'stone-light' : undefined
}

function ariaLabel(item: DayItem) {
  const label = item.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return isAvailable(item.date) ? `${label}, times available` : `${label}, unavailable`
}
</script>

<style scoped>
/* Month and year read as a heading here, not a button into year/month views */
.booking-calendar__controls {
  padding-inline: 0;
}

.booking-calendar__controls :deep(.v-date-picker-controls__month-btn) {
  pointer-events: none;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  padding-inline: 0;
  color: rgb(var(--v-theme-charcoal));
  opacity: 1;
}

.booking-calendar__controls :deep(.v-date-picker-controls__mode-btn) {
  display: none;
}

.booking-calendar__month {
  padding: 0;
}

.booking-calendar__month :deep(.v-date-picker-month__days) {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  flex: 1 1 auto;
  column-gap: 4px;
  row-gap: 4px;
}

.booking-calendar__month :deep(.v-date-picker-month__weekday) {
  font-family: var(--font-nav);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  color: rgb(var(--v-theme-stone));
}

.booking-calendar__month :deep(.v-date-picker-month__day) {
  width: auto;
  height: auto;
}

.booking-calendar__day {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}

.booking-calendar__day-btn {
  width: 100% !important;
  max-width: 52px;
  height: auto !important;
  min-width: 0 !important;
  aspect-ratio: 1;
  font-size: 0.9375rem;
  letter-spacing: 0;
}

/* Unavailable and past days: plain muted numbers, not greyed-out buttons */
.booking-calendar__day-btn.v-btn--disabled {
  opacity: 1;
  color: rgba(var(--v-theme-charcoal), 0.35) !important;
}

.booking-calendar__today {
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 4px;
  height: 4px;
  margin-left: -2px;
  border-radius: 50%;
  background-color: currentColor;
  color: rgb(var(--v-theme-blush));
  pointer-events: none;
}
</style>
