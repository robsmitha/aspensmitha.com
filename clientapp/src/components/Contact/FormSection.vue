<template>
  <v-container class="py-14 py-md-20">
    <v-row>
      <v-col cols="12" md="5" class="d-flex flex-column">
        <v-img
          :src="portfolioPhoto('aspenPortrait', 900, 1150)"
          aspect-ratio="0.8"
          cover
          class="contact-image mb-8"
        ></v-img>

        <div>
          <h2 class="font-display text-charcoal contact-heading mb-3">Prefer to reach out directly?</h2>
          <p class="font-display text-stone contact-copy mb-6">
            I'd love to hear from you. Send an email or find me on social &mdash; I try to
            respond within a day or two.
          </p>

          <a href="mailto:aspensmithaphotography@gmail.com" class="font-nav text-charcoal contact-email d-block mb-4">
            aspensmithaphotography@gmail.com
          </a>

          <div class="d-flex ga-2">
            <v-btn icon="mdi-instagram" variant="text" color="charcoal" size="small" href="https://instagram.com" target="_blank"></v-btn>
            <v-btn icon="mdi-facebook" variant="text" color="charcoal" size="small" href="https://facebook.com" target="_blank"></v-btn>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6" offset-md="1">
        <v-form class="contact-form">
          <label class="font-nav tracking-wide text-caption text-stone field-label">Name *</label>
          <v-text-field
            v-model="form.name"
            variant="outlined"
            color="blush"
            rounded="0"
            placeholder="Enter your name"
            class="font-display mb-4"
          ></v-text-field>

          <v-row>
            <v-col cols="12" sm="6">
              <label class="font-nav tracking-wide text-caption text-stone field-label">Email *</label>
              <v-text-field
                v-model="form.email"
                variant="outlined"
                color="blush"
                rounded="0"
                type="email"
                placeholder="Enter your email"
                class="font-display mb-4"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <label class="font-nav tracking-wide text-caption text-stone field-label">Phone</label>
              <v-text-field
                v-model="form.phone"
                variant="outlined"
                color="blush"
                rounded="0"
                type="tel"
                placeholder="Enter your phone number"
                class="font-display mb-4"
              ></v-text-field>
            </v-col>
          </v-row>

          <label class="font-nav tracking-wide text-caption text-stone field-label">
            What type of session are you interested in? *
          </label>
          <v-text-field
            v-model="form.sessionType"
            variant="outlined"
            color="blush"
            rounded="0"
            placeholder="Engagement, Senior, Family, Maternity, etc."
            class="font-display mb-4"
          ></v-text-field>

          <label class="font-nav tracking-wide text-caption text-stone field-label">
            Tell me about you &amp; what your ideal photoshoot would include!
          </label>
          <v-textarea
            v-model="form.message"
            variant="outlined"
            color="blush"
            rounded="0"
            rows="5"
            placeholder="Type your response here..."
            class="font-display mb-6"
          ></v-textarea>

          <v-btn
            color="charcoal"
            size="large"
            rounded="0"
            class="font-nav tracking-wide text-caption"
          >
            Submit
          </v-btn>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { portfolioPhoto } from '@/utils/portfolioPhotos'

// Front-end only for now — no submission wiring yet.
const form = reactive({
  name: '',
  email: '',
  phone: '',
  sessionType: '',
  message: '',
})
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
</style>
