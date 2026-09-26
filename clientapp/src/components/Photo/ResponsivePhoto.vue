<template>
  <!-- Always rendered, even before the photo is known, so the frame holds its
       final aspect ratio and nothing shifts when the image arrives. -->
  <v-img
    :src="photo ? photoSrc(photo) : undefined"
    :srcset="photo ? photoSrcset(photo) : undefined"
    :sizes="sizes"
    :lazy-src="photo?.placeholder ?? undefined"
    :aspect-ratio="ratio"
    :position="photo ? photoPosition(photo) : undefined"
    :alt="alt ?? photo?.altText ?? ''"
    :eager="eager"
    cover
    class="responsive-photo"
  >
    <slot />
  </v-img>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { photoPosition, photoSrc, photoSrcset, type PortfolioPhoto } from '@/utils/photoUrls'

const props = withDefaults(defineProps<{
  photo: PortfolioPhoto | undefined
  /** One of PHOTO_SIZES — how wide the image renders at each breakpoint */
  sizes: string
  /** Crop for this placement; defaults to the photo's own shape */
  aspectRatio?: number | string
  alt?: string
  /** Above-the-fold only: load immediately instead of on scroll-into-view */
  eager?: boolean
}>(), {
  aspectRatio: undefined,
  alt: undefined,
  eager: false,
})

const ratio = computed(() => {
  if (props.aspectRatio !== undefined) return props.aspectRatio
  return props.photo?.width && props.photo.height ? props.photo.width / props.photo.height : undefined
})
</script>

<style scoped>
.responsive-photo {
  background-color: rgb(var(--v-theme-ivory-deep, 248, 242, 239));
}

/* The inlined placeholder is ~24px wide; blur it so it reads as a soft preview, not pixels */
.responsive-photo :deep(.v-img__img--preload) {
  filter: blur(16px);
  transform: scale(1.08);
}
</style>
