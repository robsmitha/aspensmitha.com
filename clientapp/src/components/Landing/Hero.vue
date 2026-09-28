<template>
  <section class="hero py-10 py-md-14">
    <v-container class="text-center mb-8 mb-md-10">
      <span class="font-nav tracking-widest text-caption text-blush hero-eyebrow mb-4">
        Tallahassee &amp; Beyond
      </span>

      <h1 class="font-display text-charcoal hero-name my-2">Aspen Smitha</h1>

      <p class="font-display font-italic text-charcoal hero-tagline mb-8">
        Wedding &middot; Maternity &middot; Family Photography
      </p>

      <v-btn
        variant="outlined"
        color="charcoal"
        size="large"
        rounded="0"
        class="font-nav tracking-wide text-caption"
        to="/portfolio"
      >
        View the Portfolio
      </v-btn>
    </v-container>

    <!-- A wide, edge-to-edge carousel of standout session frames — the
         "hook" for the page, kept well short of a full-viewport hero. -->
    <div class="hero-showcase" role="region" aria-roledescription="carousel" aria-label="Featured photos">
      <div ref="emblaRef" class="hero-showcase__viewport">
        <div class="hero-showcase__track">
          <div
            v-for="(key, i) in HERO_SHOWCASE_PLACEMENTS"
            :key="key"
            class="hero-showcase__slide"
            role="group"
            aria-roledescription="slide"
            :aria-label="`${i + 1} of ${HERO_SHOWCASE_PLACEMENTS.length}`"
          >
            <ResponsivePhoto
              :photo="photos.forPlacement(key)"
              :sizes="PHOTO_SIZES.showcase"
              aspect-ratio="0.75"
              :eager="i < 3"
            />
          </div>
        </div>
      </div>

      <v-btn
        v-show="canScrollPrev"
        icon="mdi-chevron-left"
        variant="flat"
        color="ivory"
        :size="mobile ? 'small' : 'default'"
        class="hero-showcase__arrow hero-showcase__arrow--prev"
        aria-label="Previous photo"
        @click="emblaApi?.scrollPrev()"
      ></v-btn>
      <v-btn
        v-show="canScrollNext"
        icon="mdi-chevron-right"
        variant="flat"
        color="ivory"
        :size="mobile ? 'small' : 'default'"
        class="hero-showcase__arrow hero-showcase__arrow--next"
        aria-label="Next photo"
        @click="emblaApi?.scrollNext()"
      ></v-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import emblaCarouselVue from 'embla-carousel-vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { HERO_SHOWCASE_PLACEMENTS } from '@/utils/sitePlacements'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const { mobile } = useDisplay()

// Centered with neighbours peeking in; every swipe or arrow press settles on a
// whole photo. Loops when there's enough to fill the screen, which Embla works
// out itself — on very wide screens the strip just sits still.
const [emblaRef, emblaApi] = emblaCarouselVue({ loop: true, align: 'center' })

const canScrollPrev = ref(false)
const canScrollNext = ref(false)

function updateArrows(api: NonNullable<typeof emblaApi.value>) {
  canScrollPrev.value = api.canScrollPrev()
  canScrollNext.value = api.canScrollNext()
}

watch(emblaApi, api => {
  if (!api) return
  updateArrows(api)
  api.on('select', updateArrows).on('reInit', updateArrows)
})

// The real gallery strip from the live site's homepage, in its original
// order. Only the first few are visible on load, so only those load eagerly.
const photos = usePhotoStore()
</script>

<style scoped>
.hero-eyebrow {
  display: inline-block;
}

.hero-name {
  font-size: clamp(2.5rem, 4vw + 1rem, 4.5rem);
  line-height: 1.05;
  letter-spacing: 0.01em;
}

.hero-tagline {
  font-size: clamp(1.125rem, 1vw + 0.75rem, 1.5rem);
  letter-spacing: 0.02em;
}

.hero-showcase {
  position: relative;
}

.hero-showcase__viewport {
  overflow: hidden;
  cursor: grab;
}

.hero-showcase__viewport:active {
  cursor: grabbing;
}

.hero-showcase__track {
  display: flex;
  /* Vertical swipes still scroll the page */
  touch-action: pan-y pinch-zoom;
}

/* Spacing via padding, not gap, so Embla's loop measures slides correctly */
.hero-showcase__slide {
  flex: 0 0 246px;
  min-width: 0;
  padding: 0 3px;
}

@media (min-width: 1280px) {
  .hero-showcase__slide {
    flex-basis: 346px;
  }
}

.hero-showcase__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.92;
  box-shadow: 0 6px 20px -6px rgba(33, 31, 28, 0.45);
}

.hero-showcase__arrow--prev {
  left: 12px;
}

.hero-showcase__arrow--next {
  right: 12px;
}
</style>
