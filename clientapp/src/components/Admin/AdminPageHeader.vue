<template>
  <div class="d-flex flex-wrap align-end justify-space-between ga-4 mb-8 mb-md-10">
    <div>
      <span class="font-nav tracking-widest text-caption text-blush text-uppercase">{{ eyebrow }}</span>
      <h1 class="font-display text-charcoal admin-heading mt-2">{{ title }}</h1>
      <p v-if="subtitle" class="font-nav text-caption text-stone mt-1 mb-0">{{ subtitle }}</p>
    </div>
    <div class="d-flex align-center ga-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  subtitle?: string
}>()
</script>

<style scoped>
.admin-heading {
  font-size: clamp(2rem, 2vw + 1.25rem, 2.75rem);
  line-height: 1.1;
}
</style>
