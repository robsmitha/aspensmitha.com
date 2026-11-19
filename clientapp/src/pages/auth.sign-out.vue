<template>
  <v-container class="fill-height d-flex align-center justify-center" style="min-height: 60vh">
    <div class="text-center">
      <v-progress-circular indeterminate color="sage" size="28" width="2" aria-hidden="true" />
      <p class="font-nav text-caption text-sage mt-4" role="status">Signing you out…</p>
    </div>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: landing
</route>

<script setup lang="ts">
import { onMounted } from 'vue'
import { signOut } from '@/auth'

onMounted(async () => {
  try {
    await signOut()
  } catch (error) {
    console.error('Could not sign out cleanly', error)
    window.location.replace('/')
  }
})
</script>
