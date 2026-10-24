<template>
  <v-sheet color="ivory-deep" class="py-16 py-md-24">
    <v-container>
      <SectionHeading>Testimonials</SectionHeading>

      <div
        class="testimonials"
        role="region"
        aria-roledescription="carousel"
        aria-label="Client testimonials"
      >
        <div ref="emblaRef" class="testimonials__viewport">
          <div class="testimonials__track">
            <figure
              v-for="(item, i) in TESTIMONIALS"
              :key="i"
              class="testimonials__slide text-center"
              role="group"
              aria-roledescription="slide"
              :aria-label="`${i + 1} of ${TESTIMONIALS.length}`"
            >
              <v-icon color="blush" size="28" class="mb-6">mdi-format-quote-open</v-icon>

              <blockquote class="font-display font-italic text-charcoal testimonial-quote mx-auto mb-8">
                {{ item.quote }}
              </blockquote>

              <figcaption class="font-nav tracking-widest text-caption text-stone">
                <template v-if="item.name">{{ item.name }} &middot; </template>{{ item.session }}
              </figcaption>
            </figure>
          </div>
        </div>

        <div class="d-flex align-center justify-center ga-4 mt-10">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            color="sage"
            size="small"
            aria-label="Previous testimonial"
            @click="emblaApi?.scrollPrev()"
          ></v-btn>

          <div class="d-flex align-center">
            <button
              v-for="(_, i) in TESTIMONIALS"
              :key="i"
              type="button"
              class="testimonials__dot"
              :class="{ 'testimonials__dot--active': i === selected }"
              :aria-label="`Show testimonial ${i + 1}`"
              :aria-current="i === selected ? 'true' : undefined"
              @click="emblaApi?.scrollTo(i)"
            ></button>
          </div>

          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            color="sage"
            size="small"
            aria-label="Next testimonial"
            @click="emblaApi?.scrollNext()"
          ></v-btn>
        </div>
      </div>
    </v-container>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import SectionHeading from '@/components/Landing/SectionHeading.vue'
import { TESTIMONIALS } from '@/content/testimonials'

// One review at a time, looping. Every slide sits in the same flex row, so the
// slider is as tall as the longest review and nothing below it moves when
// the slide changes.
const [emblaRef, emblaApi] = emblaCarouselVue({ loop: true, align: 'center' })

const selected = ref(0)

watch(emblaApi, api => {
  if (!api) return
  const update = () => { selected.value = api.selectedScrollSnap() }
  update()
  api.on('select', update).on('reInit', update)
})
</script>

<style scoped>
.testimonials__viewport {
  overflow: hidden;
}

.testimonials__track {
  display: flex;
  /* Vertical swipes still scroll the page */
  touch-action: pan-y pinch-zoom;
}

.testimonials__slide {
  flex: 0 0 100%;
  min-width: 0;
  margin: 0;
  padding-inline: 8px;
}

.testimonial-quote {
  font-size: clamp(1.25rem, 1.5vw + 0.9rem, 2rem);
  line-height: 1.5;
  max-width: 820px;
}

/* 24px tap target around an 8px dot */
.testimonials__dot {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.testimonials__dot::after {
  content: '';
  width: 8px;
  height: 8px;
  border: 1px solid rgb(var(--v-theme-sage));
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.testimonials__dot--active::after {
  background-color: rgb(var(--v-theme-sage));
}

.testimonials__dot:focus-visible {
  outline: 2px solid rgb(var(--v-theme-sage));
  outline-offset: 3px;
}
</style>
