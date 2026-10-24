<template>
  <div class="text-center mb-12 mb-md-16">
    <h2 class="font-heading text-charcoal section-heading mt-4">
      <slot />
    </h2>
    <span class="section-heading__rule" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
.section-heading {
  font-size: clamp(2.25rem, 2.5vw + 1.25rem, 3rem);
}

/* Short green accent line under the heading */
.section-heading__rule {
  display: block;
  width: 64px;
  height: 1px;
  margin: 20px auto 0;
  background-color: rgb(var(--v-theme-sage));
}
</style>
