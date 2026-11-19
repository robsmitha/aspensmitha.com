<template>
  <v-container class="fill-height d-flex align-center justify-center" style="min-height: 60vh">
    <div class="text-center">
      <template v-if="failed">
        <p class="font-nav text-body-1 text-charcoal mb-4">The sign-in page couldn't be opened.</p>
        <a href="" class="font-nav text-sage">Try again</a>
      </template>
      <template v-else>
        <v-progress-circular indeterminate color="sage" size="28" width="2" aria-hidden="true" />
        <p class="font-nav text-caption text-sage mt-4" role="status">Taking you to sign in…</p>
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
import { useRoute } from 'vue-router'
import { safeReturnTo, signIn } from '@/auth'

const route = useRoute()
const failed = ref(false)

onMounted(async () => {
  try {
    await signIn(safeReturnTo(route.query.returnTo))
  } catch (error) {
    console.error('Could not start sign-in', error)
    failed.value = true
  }
})
</script>
