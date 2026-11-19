<template>
  <v-container class="fill-height d-flex align-center justify-center" style="min-height: 60vh">
    <div class="text-center">
      <template v-if="failed">
        <p class="font-nav text-body-1 text-charcoal mb-4">We couldn't sign you in.</p>
        <a :href="SIGN_IN_URL" class="font-nav text-sage">Try again</a>
      </template>
      <template v-else>
        <v-progress-circular indeterminate color="sage" size="28" width="2" aria-hidden="true" />
        <p class="font-nav text-caption text-sage mt-4" role="status">Signing you in…</p>
      </template>
    </div>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: landing
</route>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SIGN_IN_URL, completeSignIn } from '@/auth'

const failed = ref(false)

// Where the sign-in page sends people back to. Finishes the sign-in, then goes where they were heading.
onMounted(async () => {
  try {
    const returnTo = await completeSignIn()
    if (returnTo) {
      // A full load, so every part of the page sees the signed-in person from the start
      window.location.replace(returnTo)
      return
    }
  } catch (error) {
    console.error('Sign-in did not complete', error)
  }
  failed.value = true
})
</script>
