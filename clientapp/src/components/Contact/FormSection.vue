<template>
  <v-container class="py-14 py-md-20">
    <v-row>
      <v-col cols="12" md="5" class="d-flex flex-column">
        <ResponsivePhoto
          :photo="photos.forPlacement('contact-portrait')"
          :sizes="PHOTO_SIZES.fiveTwelfths"
          aspect-ratio="0.8"
          class="contact-image mb-8"
        />

        <div>
          <h2 class="font-display text-charcoal contact-heading mb-3">Prefer to reach out directly?</h2>
          <p class="font-display text-stone contact-copy mb-6">
            I'd love to hear from you. Send an email or find me on social &mdash; I try to
            respond within a day or two.
          </p>

          <div class="d-flex ga-2">
            <v-btn icon="mdi-instagram" variant="text" color="charcoal" size="small" href="https://instagram.com" target="_blank"></v-btn>
            <v-btn icon="mdi-facebook" variant="text" color="charcoal" size="small" href="https://facebook.com" target="_blank"></v-btn>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6" offset-md="1">
        <v-form ref="formRef" class="contact-form" validate-on="blur lazy" @submit.prevent="submit">
          <label for="contact-name" class="font-nav tracking-wide text-caption text-stone field-label">Name *</label>
          <v-text-field
            id="contact-name"
            v-model="form.name"
            :rules="rules.name"
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
              <label for="contact-email" class="font-nav tracking-wide text-caption text-stone field-label">Email *</label>
              <v-text-field
                id="contact-email"
                v-model="form.email"
                :rules="rules.email"
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
              <label for="contact-phone" class="font-nav tracking-wide text-caption text-stone field-label">Phone</label>
              <v-text-field
                id="contact-phone"
                v-model="form.phone"
                :rules="rules.phone"
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

          <label for="contact-subject" class="font-nav tracking-wide text-caption text-stone field-label">
            What type of session are you interested in? *
          </label>
          <v-text-field
            id="contact-subject"
            v-model="form.subject"
            :rules="rules.subject"
            :error-messages="fieldErrors.subject"
            variant="outlined"
            color="blush"
            rounded="0"
            placeholder="Engagement, Senior, Family, Maternity, etc."
            maxlength="200"
            class="font-display mb-4"
            @update:model-value="fieldErrors.subject = []"
          ></v-text-field>

          <label for="contact-message" class="font-nav tracking-wide text-caption text-stone field-label">
            Tell me about you &amp; what your ideal photoshoot would include!
          </label>
          <v-textarea
            id="contact-message"
            v-model="form.message"
            :rules="rules.message"
            :error-messages="fieldErrors.message"
            variant="outlined"
            color="blush"
            rounded="0"
            rows="5"
            placeholder="Type your response here..."
            :counter="MESSAGE_MAX"
            class="font-display mb-6"
            @update:model-value="fieldErrors.message = []"
          ></v-textarea>

          <!-- Honeypot: invisible to people, so only bots fill it in -->
          <div class="contact-honeypot" aria-hidden="true">
            <label for="contact-website">Website</label>
            <input id="contact-website" v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off">
          </div>

          <TurnstileWidget
            ref="turnstileRef"
            :site-key="TURNSTILE_SITE_KEY"
            @verified="onTurnstileVerified"
            @expired="turnstileToken = ''"
            @error="onTurnstileError"
            @interactive="turnstileInteractive = $event"
          />

          <div v-if="turnstileError" class="font-display text-error contact-feedback mb-4" role="alert">
            {{ turnstileError }}
            <a href="#" class="text-charcoal contact-retry" @click.prevent="retryVerification">Retry verification</a>
          </div>

          <div v-if="submitError" class="font-display text-error contact-feedback mb-4" role="alert">
            {{ submitError }}
          </div>

          <div v-if="submitted" class="font-display text-charcoal contact-feedback mb-4" role="status">
            Thank you! Your message is on its way &mdash; I'll be in touch within a day or two.
          </div>

          <v-btn
            type="submit"
            color="charcoal"
            size="large"
            rounded="0"
            :loading="submitting"
            class="font-nav tracking-wide text-caption mt-2"
          >
            Submit
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import TurnstileWidget from '@/components/_helpers/TurnstileWidget.vue'
import apiClient from '@/api/elysianClient'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const photos = usePhotoStore()

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
/** Error key (after camelCasing) for a missing or failed Turnstile token, see Elysian's SendContactMessageCommand */
const TURNSTILE_ERROR_KEY = 'turnstileToken'
const MESSAGE_MAX = 5000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9+()\-.\s]{7,30}$/

type FieldName = 'name' | 'email' | 'phone' | 'subject' | 'message'
type Rule = (value: string) => true | string

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: '',
})

const form = reactive(emptyForm())

// Mirrors the server-side limits on Elysian's SendContactMessageCommand; the server re-validates everything
const required = (message: string): Rule => value => !!value?.trim() || message
const maxLength = (max: number, label: string): Rule => value => (value?.length ?? 0) <= max || `${label} must be ${max} characters or fewer.`
const rules: Record<FieldName, Rule[]> = {
  name: [required('Please enter your name.'), maxLength(100, 'Name')],
  email: [
    required('Please enter your email.'),
    value => EMAIL_PATTERN.test(value.trim()) || 'Please enter a valid email address.',
    maxLength(320, 'Email'),
  ],
  phone: [value => !value?.trim() || PHONE_PATTERN.test(value.trim()) || 'Please enter a valid phone number.'],
  subject: [required("Please tell me what type of session you're interested in."), maxLength(200, 'Session type')],
  message: [maxLength(MESSAGE_MAX, 'Message')],
}

const formRef = ref<{ validate: () => Promise<{ valid: boolean }>, resetValidation: () => void }>()
const turnstileRef = ref<InstanceType<typeof TurnstileWidget>>()

const turnstileToken = ref('')
const turnstileError = ref('')
const turnstileInteractive = ref(false)
const submitError = ref('')
const submitting = ref(false)
const submitted = ref(false)
const fieldErrors = reactive<Record<FieldName, string[]>>({
  name: [],
  email: [],
  phone: [],
  subject: [],
  message: [],
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
  if (submitting.value) return
  submitted.value = false
  clearServerErrors()

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  if (!turnstileToken.value) {
    turnstileError.value = turnstileInteractive.value
      ? 'Please complete the verification check above before submitting.'
      : "We're still checking your browser. Please try again in a moment."
    return
  }

  submitting.value = true
  const response = await apiClient.postData('/api/contact', {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    subject: form.subject.trim(),
    message: form.message.trim(),
    website: form.website,
    turnstileToken: turnstileToken.value,
  })
  submitting.value = false

  // Tokens are single use, so every attempt needs a fresh challenge
  turnstileRef.value?.reset()

  if (response.success) {
    Object.assign(form, emptyForm())
    formRef.value!.resetValidation()
    submitted.value = true
    return
  }

  // Validation errors are keyed by the C# property name (e.g. "Name"), so camelCase them to match the form
  const errors = new Map(
    Array.from(response.errors ?? [], ([key, messages]) => [key.charAt(0).toLowerCase() + key.slice(1), messages] as const)
  )
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
    ? 'You\'ve sent a few messages in a short time. Please wait a few minutes and try again.'
    : 'Something went wrong sending your message. Please try again, or email me directly at aspensmithaphotography@gmail.com.'
}
</script>

<style scoped>
.contact-image {
  box-shadow: 0 24px 60px -20px rgba(33, 31, 28, 0.3);
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
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.35);
  transition: border-color 0.2s ease;
}

.contact-email:hover {
  border-color: rgb(var(--v-theme-charcoal));
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
}

.contact-form :deep(.v-field) {
  border-radius: 0;
}

.contact-form :deep(.v-field__input) {
  font-family: var(--font-display);
  font-size: 1.0625rem;
}

.contact-honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.contact-feedback {
  font-size: 1rem;
  line-height: 1.5;
}

.contact-retry {
  margin-left: 0.25rem;
  text-underline-offset: 3px;
}
</style>
