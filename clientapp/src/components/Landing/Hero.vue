<template>
  <section class="hero py-10 py-md-14">
    <v-container class="text-center mb-8 mb-md-10">
      <h1 class="font-heading text-charcoal hero-name my-2">Aspen Smitha</h1>

      <p class="font-script text-charcoal hero-tagline mb-0">Photography</p>

      <p class="font-nav text-charcoal hero-location mt-4 mb-0">Tallahassee &amp; Beyond</p>
    </v-container>

    <!-- A wide, edge-to-edge carousel of standout session frames — the
         "hook" for the page, kept well short of a full-viewport hero. -->
    <div class="hero-showcase" role="region" aria-roledescription="carousel" aria-label="Featured photos">
      <div ref="emblaRef" class="hero-showcase__viewport">
        <div class="hero-showcase__track" :class="{ 'hero-showcase__track--centered': fits }">
          <div
            v-for="(key, i) in slides"
            :key="key"
            class="hero-showcase__slide"
            role="group"
            aria-roledescription="slide"
            :aria-label="`${i + 1} of ${slides.length}`"
          >
            <PlacementPhoto
              :placement="key"
              :sizes="PHOTO_SIZES.showcase"
              :eager="isVisibleAtLoad(i)"
              :priority="i === 0 ? 'high' : undefined"
            />
          </div>
        </div>
      </div>

      <v-btn
        v-show="!fits && canScrollPrev"
        icon="mdi-chevron-left"
        variant="flat"
        color="ivory"
        :size="mobile ? 'small' : 'default'"
        class="hero-showcase__arrow hero-showcase__arrow--prev"
        aria-label="Previous photo"
        @click="emblaApi?.scrollPrev()"
      ></v-btn>
      <v-btn
        v-show="!fits && canScrollNext"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import emblaCarouselVue from 'embla-carousel-vue'
import PlacementPhoto from '@/components/Photo/PlacementPhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PLACEMENTS_FROM_CDN } from '@/utils/placementConfig'
import { HERO_SHOWCASE_PLACEMENTS, HERO_VISIBLE_AT_LOAD } from '@/utils/sitePlacements'
import { PHOTO_SIZES } from '@/utils/photoUrls'

const { mobile } = useDisplay()

// Starts with slide 1 at the left edge and the rest following to its right
// (looping, so the last slide only comes round after scrolling). On screens
// wider than the whole strip there's nothing to scroll, so the carousel
// switches off and the photos sit centered instead.
const fits = ref(false)
const emblaOptions = computed(() => ({ loop: true, align: 'start' as const, active: !fits.value }))
const [emblaRef, emblaApi] = emblaCarouselVue(emblaOptions)

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

// Only read on the API rollback path (PlacementPhoto loads it there)
const photos = usePhotoStore()

function measureFit() {
  const viewport = emblaRef.value
  const track = viewport?.firstElementChild
  if (!viewport || !track) return
  const stripWidth = Array.from(track.children)
    .reduce((sum, slide) => sum + (slide as HTMLElement).offsetWidth, 0)
  fits.value = stripWidth <= viewport.clientWidth
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  measureFit()
  resizeObserver = new ResizeObserver(measureFit)
  if (emblaRef.value) resizeObserver.observe(emblaRef.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

// From the CDN every slot always has an image (the publisher fills empty ones
// with a fallback), so the strip is fixed. On the API rollback path, hold every
// frame while photos load so nothing shifts, then drop any unfilled slot.
const slides = computed(() => PLACEMENTS_FROM_CDN || !photos.loaded
  ? HERO_SHOWCASE_PLACEMENTS
  : HERO_SHOWCASE_PLACEMENTS.filter(key => photos.forPlacement(key)))

// The first few slides are on screen at load, so they load right away (the
// first two are also preloaded in index.html); the rest wait until they
// scroll into view.
function isVisibleAtLoad(index: number) {
  return HERO_VISIBLE_AT_LOAD.includes(index + 1)
}

watch(() => slides.value.length, () => nextTick(measureFit))
</script>

<style scoped>
.hero-name {
  font-size: clamp(2.5rem, 4vw + 1rem, 4.5rem);
  line-height: 1.05;
  letter-spacing: 0.01em;
  text-wrap: balance;
}

/* Just under the title's size (40–72px); the script's small letters make it
   read noticeably smaller than Bodoni at the same size */
.hero-tagline {
  font-size: clamp(2.25rem, 3.6vw + 0.9rem, 4rem);
  line-height: 1.1;
  letter-spacing: 0.01em;
}

/* Same font as the nav links, larger, and well under the tagline */
.hero-location {
  font-size: clamp(calc(1rem - 7pt), calc(1vw + 0.75rem - 7pt), calc(1.5rem - 7pt));
  letter-spacing: 0.2em;
  text-transform: uppercase;
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

.hero-showcase__track--centered {
  justify-content: center;
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
