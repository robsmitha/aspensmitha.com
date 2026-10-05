<template>
  <v-sheet color="surface" border rounded="0" class="booking-form pa-6 pa-sm-8 pa-md-10">
    <span class="font-nav tracking-widest text-caption text-blush">YOUR SESSION</span>
    <h2 class="font-display text-charcoal booking-form__heading mt-1 mb-6">Confirm your details</h2>

    <dl class="booking-recap mb-8">
      <div>
        <dt class="font-nav tracking-wide text-caption text-stone">Session</dt>
        <dd class="font-display text-charcoal">{{ session.title }}</dd>
      </div>
      <div>
        <dt class="font-nav tracking-wide text-caption text-stone">Date</dt>
        <dd class="font-display text-charcoal">{{ formatLongDate(start) }}</dd>
      </div>
      <div>
        <dt class="font-nav tracking-wide text-caption text-stone">Time</dt>
        <dd class="font-display text-charcoal">{{ formatTime(start) }} &ndash; {{ formatTime(end) }}</dd>
      </div>
      <div>
        <dt class="font-nav tracking-wide text-caption text-stone">Time zone</dt>
        <dd class="font-display text-charcoal">{{ timeZoneLabel(start) }}</dd>
      </div>
      <div>
        <dt class="font-nav tracking-wide text-caption text-stone">Price</dt>
        <dd class="font-display text-charcoal">{{ formatPrice(session) }}</dd>
      </div>
    </dl>

    <v-form ref="formRef" class="booking-fields" validate-on="blur lazy" @submit.prevent="submit">
      <label for="booking-name" class="font-nav tracking-wide text-caption text-stone field-label">Name *</label>
      <v-text-field
        id="booking-name"
        v-model="form.name"
        :rules="nameRules"
        :error-messages="fieldErrors.name"
        variant="outlined"
        color="blush"
        rounded="0"
        placeholder="Enter your name"
        autocomplete="name"
        maxlength="100"
        class="font-display mb-4"
        @update:model-value="fieldErrors.name = []"
      ></v-text-field>

      <v-row>
        <v-col cols="12" sm="6">
          <label for="booking-email" class="font-nav tracking-wide text-caption text-stone field-label">Email *</label>
          <v-text-field
            id="booking-email"
            v-model="form.email"
            :rules="emailRules"
            :error-messages="fieldErrors.email"
            variant="outlined"
            color="blush"
            rounded="0"
            type="email"
            placeholder="Enter your email"
            autocomplete="email"
            maxlength="320"
            class="font-display mb-4"
            @update:model-value="fieldErrors.email = []"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="6">
          <label for="booking-phone" class="font-nav tracking-wide text-caption text-stone field-label">Phone</label>
          <v-text-field
            id="booking-phone"
            v-model="form.phone"
            :rules="phoneRules"
            :error-messages="fieldErrors.phone"
            variant="outlined"
            color="blush"
            rounded="0"
            type="tel"
            placeholder="Enter your phone number"
            autocomplete="tel"
            maxlength="30"
            class="font-display mb-4"
            @update:model-value="fieldErrors.phone = []"
          ></v-text-field>
        </v-col>
      </v-row>

      <label for="booking-message" class="font-nav tracking-wide text-caption text-stone field-label">
        Tell me about your session
      </label>
      <v-textarea
        id="booking-message"
        v-model="form.message"
        :rules="messageRules"
        :error-messages="fieldErrors.message"
        variant="outlined"
        color="blush"
        rounded="0"
        rows="4"
        placeholder="Location ideas, who'll be joining, outfit questions, or a rush-delivery request..."
        :counter="MESSAGE_MAX"
        class="font-display mb-2"
        @update:model-value="fieldErrors.message = []"
      ></v-textarea>

      <v-checkbox
        v-model="form.policiesAccepted"
        :rules="[(value: boolean) => value || 'Please confirm you\'ve read and agree to the policies.']"
        :error-messages="fieldErrors.policiesAccepted"
        color="charcoal"
        density="compact"
        class="booking-policies mb-4"
        @update:model-value="fieldErrors.policiesAccepted = []"
      >
        <template #label>
          <span class="font-display text-charcoal">
            I've read and agree to the
            <a href="#" class="text-charcoal booking-link" @click.prevent.stop="policiesOpen = true">Payment and Gallery Policies</a>.
          </span>
        </template>
      </v-checkbox>

      <BookingPoliciesDialog v-model="policiesOpen" @agree="agreeToPolicies" />

      <!-- Honeypot: invisible to people, so only bots fill it in -->
      <div class="booking-honeypot" aria-hidden="true">
        <label for="booking-website">Website</label>
        <input id="booking-website" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
      </div>

      <TurnstileWidget
        ref="turnstileRef"
        :site-key="TURNSTILE_SITE_KEY"
        @verified="onTurnstileVerified"
        @expired="turnstileToken = ''"
        @error="onTurnstileError"
        @interactive="turnstileInteractive = $event"
      />

      <div v-if="turnstileError" class="font-display text-error booking-feedback mb-4" role="alert">
        {{ turnstileError }}
        <a href="#" class="text-charcoal booking-link ml-1" @click.prevent="retryVerification">Retry verification</a>
      </div>

      <div v-if="submitError" class="font-display text-error booking-feedback mb-4" role="alert">
        {{ submitError }}
      </div>

      <v-btn
        type="submit"
        color="charcoal"
        size="large"
        rounded="0"
        :loading="submitting"
        :disabled="submitting"
        class="font-nav tracking-wide text-caption mt-2"
      >
        Confirm booking
      </v-btn>
    </v-form>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { event } from 'vue-gtag'
import TurnstileWidget from '@/components/_helpers/TurnstileWidget.vue'
import BookingPoliciesDialog from '@/components/Booking/BookingPoliciesDialog.vue'
import apiClient from '@/api/elysianClient'
import type { BookingSession } from '@/store/sessions'
import { CONTACT_EMAIL } from '@/utils/contact'
import { browserTimeZone, formatLongDate, formatPrice, formatTime, timeZoneLabel } from '@/utils/bookingFormat'
import { MESSAGE_MAX, camelCaseErrors, emailRules, messageRules, nameRules, phoneRules } from '@/utils/formRules'

export interface BookingConfirmation {
  slug: string
  title: string
  start: string
  end: string
  durationMinutes: number
  price: number | null
  isPriceFrom: boolean
  location: string | null
  name: string
  email: string
}

const props = defineProps<{
  session: BookingSession
  start: Date
}>()

const emit = defineEmits<{
  booked: [confirmation: BookingConfirmation]
  /** The time was taken in the meantime; the server's message is passed along */
  conflict: [message: string]
  /** Booking can't happen online right now */
  unavailable: [message: string]
}>()

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
/** Error key (after camelCasing) for a missing or failed Turnstile token, see Elysian's CreateBookingCommand */
const TURNSTILE_ERROR_KEY = 'turnstileToken'

type FieldName = 'name' | 'email' | 'phone' | 'message' | 'policiesAccepted'

const end = computed(() => new Date(props.start.getTime() + props.session.durationMinutes * 60_000))

const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
  policiesAccepted: false,
  website: '',
})

const policiesOpen = ref(false)

function agreeToPolicies() {
  form.policiesAccepted = true
  fieldErrors.policiesAccepted = []
  policiesOpen.value = false
}

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> }>()
const turnstileRef = ref<InstanceType<typeof TurnstileWidget>>()

const turnstileToken = ref('')
const turnstileError = ref('')
const turnstileInteractive = ref(false)
const submitError = ref('')
const submitting = ref(false)
const fieldErrors = reactive<Record<FieldName, string[]>>({
  name: [],
  email: [],
  phone: [],
  message: [],
  policiesAccepted: [],
})

function onTurnstileVerified(token: string) {
  turnstileToken.value = token
  turnstileError.value = ''
}

function onTurnstileError() {
  turnstileToken.value = ''
  turnstileError.value = "Verification couldn't be completed."
}

function retryVerification() {
  turnstileError.value = ''
  turnstileRef.value?.reset()
}

function clearServerErrors() {
  submitError.value = ''
  turnstileError.value = ''
  for (const key of Object.keys(fieldErrors) as FieldName[]) {
    fieldErrors[key] = []
  }
}

async function submit() {
  // The button is disabled while submitting; this also stops a double Enter press
  if (submitting.value) return
  clearServerErrors()

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  if (!turnstileToken.value) {
    turnstileError.value = turnstileInteractive.value
      ? 'Please complete the verification check above before confirming.'
      : "We're still checking your browser. Please try again in a moment."
    return
  }

  submitting.value = true
  const response = await apiClient.postData(`/api/booking/sessions/${encodeURIComponent(props.session.slug)}`, {
    start: props.start.toISOString(),
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    message: form.message.trim(),
    policiesAccepted: form.policiesAccepted,
    timeZone: browserTimeZone(),
    website: form.website,
    turnstileToken: turnstileToken.value,
  })
  submitting.value = false

  // Tokens are single use, so every attempt needs a fresh challenge
  turnstileRef.value?.reset()
  turnstileToken.value = ''

  if (response.success) {
    event('generate_lead', { lead_source: 'booking', session_type: props.session.slug })
    emit('booked', response.data as BookingConfirmation)
    return
  }

  if (response.statusCode === 409) {
    emit('conflict', response.errors?.get('SLOT_UNAVAILABLE')?.[0] ?? 'Sorry, that time is no longer available. Please choose another time.')
    return
  }
  if (response.statusCode === 503) {
    emit('unavailable', response.errors?.get('BOOKING_UNAVAILABLE')?.[0] ?? '')
    return
  }

  const errors = camelCaseErrors(response.errors)
  if (errors.has(TURNSTILE_ERROR_KEY)) {
    turnstileError.value = "We couldn't verify you're human. Please complete the verification again and resubmit."
    return
  }

  let hasFieldErrors = false
  for (const [key, messages] of errors) {
    if (key in fieldErrors) {
      fieldErrors[key as FieldName] = messages
      hasFieldErrors = true
    }
  }
  if (hasFieldErrors) return

  submitError.value = response.statusCode === 429
    ? "You've made a few booking attempts in a short time. Please wait a few minutes and try again."
    : `Something went wrong confirming your booking. Please try again, or email me directly at ${CONTACT_EMAIL}.`
}
</script>

<style scoped>
.booking-form {
  box-shadow: 0 24px 48px -24px rgba(33, 31, 28, 0.25);
}

.booking-form__heading {
  font-size: clamp(1.75rem, 1.5vw + 1.1rem, 2.25rem);
  line-height: 1.15;
}

.booking-recap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.25rem 2rem;
  margin: 0;
}

.booking-recap dd {
  font-size: 1.125rem;
  line-height: 1.4;
  margin: 0.25rem 0 0;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
}

.booking-fields :deep(.v-field) {
  border-radius: 0;
}

.booking-fields :deep(.v-field__input) {
  font-family: var(--font-display);
  font-size: 1.0625rem;
}

.booking-policies :deep(.v-label) {
  opacity: 1;
  font-size: 1.0625rem;
}

.booking-link {
  text-underline-offset: 3px;
}

.booking-honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.booking-feedback {
  font-size: 1rem;
  line-height: 1.5;
}
</style>
