<template>
  <!-- Fixed URLs straight from Cloudflare: the image request starts as soon as
       this renders (or earlier, from the preload in index.html), with no API
       call first. A plain <img> rather than v-img, whose JS-driven loading
       would hold above-the-fold images back. -->
  <div
    v-if="PLACEMENTS_FROM_CDN && spec"
    class="placement-photo"
    :style="{ aspectRatio: String(spec.ratio) }"
  >
    <img
      :src="placementUrl(PLACEMENT_IMAGE_BASE, spec, defaultWidth)"
      :srcset="placementSrcset(PLACEMENT_IMAGE_BASE, spec)"
      :sizes="sizes"
      :width="defaultWidth"
      :height="placementHeight(spec, defaultWidth)"
      :alt="alt ?? spec.alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="priority"
      decoding="async"
      class="placement-photo__img"
    />
    <div v-if="$slots.default" class="placement-photo__content">
      <slot />
    </div>
  </div>

  <!-- Rollback path (VITE_PLACEMENT_SOURCE=api): the original API-driven rendering -->
  <ResponsivePhoto
    v-else
    :photo="apiPhoto"
    :sizes="sizes"
    :aspect-ratio="spec?.ratio"
    :alt="alt"
    :eager="eager"
  >
    <slot />
  </ResponsivePhoto>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PLACEMENTS_FROM_CDN, PLACEMENT_IMAGE_BASE } from '@/utils/placementConfig'
import {
  placementDefaultWidth,
  placementHeight,
  placementSlot,
  placementSrcset,
  placementUrl,
} from '@/utils/placementImages'
import { portfolioCoverKey } from '@/utils/sitePlacements'

const props = withDefaults(defineProps<{
  /** Placement key, e.g. "home-intro" (placementSlots.json) */
  placement: string
  /** One of PHOTO_SIZES — how wide the image renders at each breakpoint */
  sizes: string
  /** Defaults to the slot's alt text */
  alt?: string
  /** Above-the-fold only: load immediately instead of on scroll-into-view */
  eager?: boolean
  /** "high" for the one or two images most likely to be the largest paint */
  priority?: 'high' | 'low' | 'auto'
}>(), {
  alt: undefined,
  eager: false,
  priority: undefined,
})

const spec = computed(() => placementSlot(props.placement))
const defaultWidth = computed(() => (spec.value ? placementDefaultWidth(spec.value) : 0))

if (import.meta.env.DEV && !spec.value) {
  console.warn(`PlacementPhoto: "${props.placement}" isn't in placementSlots.json`)
}

// Only the rollback path talks to the API (load() is shared and idempotent)
const photos = usePhotoStore()
if (!PLACEMENTS_FROM_CDN) photos.load()

/** Same lookups the components used before: covers fall back to the category's first photo */
const apiPhoto = computed(() => {
  const category = spec.value?.fallbackCategory
  return category && props.placement === portfolioCoverKey(category)
    ? photos.coverFor(category)
    : photos.forPlacement(props.placement)
})
</script>

<style scoped>
.placement-photo {
  position: relative;
  overflow: hidden;
  background-color: rgb(var(--v-theme-ivory-deep, 248, 242, 239));
}

.placement-photo__img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  /* Already cropped to this ratio around the focal point; cover only absorbs
     CSS that reshapes the box (the CTA's min-height on phones) */
  object-fit: cover;
}

.placement-photo__content {
  position: absolute;
  inset: 0;
}
</style>
