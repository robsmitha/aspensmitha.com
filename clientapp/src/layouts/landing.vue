<template>
  <v-sheet theme="aspen" color="background">
    <LandingBar />

    <LandingView />

    <LandingFooter />
  </v-sheet>
</template>

<script lang="ts" setup>
  import LandingBar from './landing/AppBar.vue'
  import LandingView from './landing/View.vue'
  import LandingFooter from './landing/Footer.vue'
  import { usePhotoStore } from '@/store/photos'
  import { PLACEMENTS_FROM_CDN } from '@/utils/placementConfig'

  // Home and Portfolio photos come from fixed CDN URLs (placementImages.ts);
  // pages that still need /api/portfolio load it themselves. On the API
  // rollback path, start fetching as early as possible, as before.
  if (!PLACEMENTS_FROM_CDN) usePhotoStore().load()
</script>
