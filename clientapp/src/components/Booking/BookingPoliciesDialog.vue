<template>
  <v-dialog :model-value="modelValue" max-width="640" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card color="surface" rounded="0">
      <v-toolbar color="ivory-deep" density="comfortable">
        <v-toolbar-title>
          <span class="font-display text-h5 text-charcoal">Booking Policies</span>
        </v-toolbar-title>
        <v-btn icon="mdi-close" color="stone" aria-label="Close" @click="emit('update:modelValue', false)"></v-btn>
      </v-toolbar>
      <v-divider color="stone-light" />

      <v-card-text class="pa-6 pa-md-8">
        <section v-for="(policy, index) in BOOKING_POLICIES" :key="policy.id" :class="{ 'mt-8': index > 0 }">
          <h2 class="font-nav tracking-widest text-caption text-blush text-uppercase mb-3">{{ policy.title }}</h2>
          <p v-for="(paragraph, p) in policy.paragraphs" :key="p" class="font-display text-charcoal policy-text mb-3">{{ paragraph }}</p>
        </section>
      </v-card-text>

      <v-divider color="stone-light" />
      <v-card-actions class="px-6 py-4 d-flex justify-end ga-2">
        <v-btn class="font-nav tracking-wide text-caption" rounded="0" variant="text" color="stone" @click="emit('update:modelValue', false)">
          Close
        </v-btn>
        <v-btn class="font-nav tracking-wide text-caption" rounded="0" variant="flat" color="charcoal" @click="emit('agree')">
          I agree
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { BOOKING_POLICIES } from '@/content/bookingPolicies'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  /** Agreed from inside the dialog; the form ticks its checkbox */
  agree: []
}>()
</script>

<style scoped>
.policy-text {
  font-size: 1.0625rem;
  line-height: 1.6;
}
</style>
