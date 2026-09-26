<template>
  <v-sheet theme="aspen" color="background" class="admin-shell">
    <AdminBar />

    <v-main>
      <router-view />
    </v-main>
  </v-sheet>
</template>

<script lang="ts" setup>
  import AdminBar from './admin/AppBar.vue'
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
}
</style>
