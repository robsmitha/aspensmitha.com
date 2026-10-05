<template>
  <div class="time-slots">
    <template v-if="date">
      <h3 class="font-display text-charcoal time-slots__date mb-1">{{ formatLongDate(date) }}</h3>
      <p class="d-flex align-center font-nav text-caption text-stone mb-6">
        <v-icon size="14" class="mr-1">mdi-earth</v-icon>
        Times shown in {{ timeZoneLabel(date) }}
      </p>

      <template v-if="groups.length">
        <div v-for="group in groups" :key="group.label" class="mb-6">
          <h4 class="font-nav tracking-widest text-caption text-stone mb-3">{{ group.label }}</h4>
          <v-row dense>
            <v-col v-for="slot in group.slots" :key="slot.toISOString()" cols="4">
              <v-btn
                block
                rounded="0"
                :variant="isSelected(slot) ? 'flat' : 'outlined'"
                :color="isSelected(slot) ? 'charcoal' : 'stone'"
                :aria-pressed="isSelected(slot)"
                class="font-nav time-slots__btn"
                :class="{ 'time-slots__btn--idle': !isSelected(slot) }"
                @click="emit('select', slot.toISOString())"
              >
                {{ formatTime(slot).replace(/\s?[AP]M$/, '') }}
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </template>

      <p v-else class="font-display text-charcoal time-slots__empty mb-6">
        There are no open times on this day. Please choose another date on the calendar.
      </p>
    </template>

    <p v-else-if="!loading" class="font-display text-charcoal time-slots__empty mb-6">
      There are no open times this month. Use the arrows to check another month.
    </p>

    <v-divider color="stone-light" opacity="0.6" class="mb-5"></v-divider>

    <p class="font-display text-charcoal-light time-slots__contact mb-0">
      Don't see a time that works for you?
      <router-link :to="contactLink" class="text-charcoal time-slots__link">Get in touch</router-link>
      and we'll find one that does.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatLongDate, formatTime, timeZoneLabel } from '@/utils/bookingFormat'

const props = defineProps<{
  date: Date | null
  /** Open start times on that date, in order */
  slots: Date[]
  /** ISO string of the chosen time */
  selected: string | null
  contactLink: string
  loading?: boolean
}>()

const emit = defineEmits<{ select: [iso: string] }>()

const groups = computed(() => [
  { label: 'AM', slots: props.slots.filter(s => s.getHours() < 12) },
  { label: 'PM', slots: props.slots.filter(s => s.getHours() >= 12) },
].filter(g => g.slots.length))

function isSelected(slot: Date) {
  return props.selected === slot.toISOString()
}
</script>

<style scoped>
.time-slots__date {
  font-size: clamp(1.375rem, 1vw + 1rem, 1.75rem);
  line-height: 1.2;
}

.time-slots__btn {
  font-size: 0.9375rem;
  letter-spacing: 0.02em;
}

.time-slots__btn--idle {
  color: rgb(var(--v-theme-charcoal)) !important;
  border-color: rgba(var(--v-theme-charcoal), 0.25);
}

.time-slots__btn--idle:hover {
  border-color: rgb(var(--v-theme-charcoal));
}

.time-slots__empty,
.time-slots__contact {
  font-size: 1.0625rem;
  line-height: 1.6;
}

.time-slots__link {
  text-underline-offset: 3px;
}
</style>
