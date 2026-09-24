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
</script>
