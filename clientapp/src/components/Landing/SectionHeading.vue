<template>
  <div class="text-center mb-12 mb-md-16">
    <h2 class="font-heading text-charcoal section-heading mt-4">
      <slot />
    </h2>
    <span class="heading-rule" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
.section-heading {
  font-size: clamp(2.25rem, 2.5vw + 1.25rem, 3rem);
}
</style>
