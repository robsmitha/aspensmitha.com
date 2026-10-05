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
          <h2 class="font-display text-charcoal contact-heading mb-3">Ready to book?</h2>
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
            color="charcoal"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            to="/booking"
          >
            Check availability
          </v-btn>
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
          <v-select
            id="contact-subject"
            v-model="form.subject"
            :items="sessionTypes"
            :rules="rules.subject"
            :error-messages="fieldErrors.subject"
            variant="outlined"
            color="blush"
            rounded="0"
            placeholder="Select a session type"
            class="font-display mb-4"
            @update:model-value="fieldErrors.subject = []"
          ></v-select>

          <template v-if="form.subject === OTHER_SESSION_TYPE">
            <label for="contact-subject-other" class="font-nav tracking-wide text-caption text-stone field-label">
              Please specify *
            </label>
            <v-text-field
              id="contact-subject-other"
              v-model="form.subjectOther"
              :rules="rules.subjectOther"
              :error-messages="fieldErrors.subjectOther"
              variant="outlined"
              color="blush"
              rounded="0"
              placeholder="Tell me what kind of session you have in mind"
              maxlength="200"
              class="font-display mb-4"
              @update:model-value="fieldErrors.subjectOther = []"
            ></v-text-field>
          </template>

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
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import TurnstileWidget from '@/components/_helpers/TurnstileWidget.vue'
import { event } from 'vue-gtag'
import apiClient from '@/api/elysianClient'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'
import { PORTFOLIO_CATEGORIES } from '@/utils/portfolioCategories'
import { CONTACT_EMAIL } from '@/utils/contact'
import { MESSAGE_MAX, camelCaseErrors, emailRules, maxLength, messageRules, nameRules, phoneRules, required, type Rule } from '@/utils/formRules'
import { useSessionStore } from '@/store/sessions'

const photos = usePhotoStore()

const OTHER_SESSION_TYPE = 'Other - Please specify'
const sessionTypes = [...PORTFOLIO_CATEGORIES.map(category => category.name), OTHER_SESSION_TYPE]

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY
/** Error key (after camelCasing) for a missing or failed Turnstile token, see Elysian's SendContactMessageCommand */
const TURNSTILE_ERROR_KEY = 'turnstileToken'

type FieldName = 'name' | 'email' | 'phone' | 'subject' | 'subjectOther' | 'message'

const emptyForm = () => ({
  name: '',
  email: '',
  phone: '',
  subject: '',
  subjectOther: '',
  message: '',
  website: '',
})

const form = reactive(emptyForm())

// Mirrors the server-side limits on Elysian's SendContactMessageCommand; the server re-validates everything
const rules: Record<FieldName, Rule[]> = {
  name: nameRules,
  email: emailRules,
  phone: phoneRules,
  subject: [required("Please tell me what type of session you're interested in.")],
  subjectOther: [
    value => form.subject !== OTHER_SESSION_TYPE || !!value?.trim() || 'Please specify the type of session.',
    maxLength(200, 'Session details'),
  ],
  message: messageRules,
}

// Booking pages link here as /contact?session={slug} when no time works; start the inquiry for that session
const route = useRoute()
onMounted(async () => {
  const slug = route.query.session
  if (typeof slug !== 'string' || !slug) return

  const sessions = useSessionStore()
  await sessions.load()
  const session = sessions.bySlug(slug)
  if (!session || form.subject || form.message) return

  const category = PORTFOLIO_CATEGORIES.find(c => c.slug === session.portfolioCategory)
  if (category) {
    form.subject = category.name
  } else {
    form.subject = OTHER_SESSION_TYPE
    form.subjectOther = session.title
  }
  form.message = `I'm interested in the ${session.title} session, but I couldn't find a time that works on the booking calendar. Here's when I'm available: `
})

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
  subjectOther: [],
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
  const subject = (form.subject === OTHER_SESSION_TYPE ? form.subjectOther : form.subject).trim()
  const response = await apiClient.postData('/api/contact', {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    subject,
    message: form.message.trim(),
    website: form.website,
    turnstileToken: turnstileToken.value,
  })
  submitting.value = false

  // Tokens are single use, so every attempt needs a fresh challenge
  turnstileRef.value?.reset()

  if (response.success) {
    // GA4 recommended lead event; mark it as a key event in GA to count inquiries as conversions
    event('generate_lead', { lead_source: 'contact_form', session_type: form.subject })
    Object.assign(form, emptyForm())
    formRef.value!.resetValidation()
    submitted.value = true
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
    ? 'You\'ve sent a few messages in a short time. Please wait a few minutes and try again.'
    : `Something went wrong sending your message. Please try again, or email me directly at ${CONTACT_EMAIL}.`
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
