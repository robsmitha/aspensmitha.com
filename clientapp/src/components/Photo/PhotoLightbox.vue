<template>
  <v-dialog
    :model-value="modelValue"
    fullscreen
    scrim="black"
    transition="fade-transition"
    content-class="lightbox-content"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="lightbox-backdrop" @click="close">
      <button
        class="lightbox-control lightbox-close"
        aria-label="Close"
        @click.stop="close"
      >
        <v-icon size="22">mdi-close</v-icon>
      </button>

      <button
        v-if="hasMultiple"
        class="lightbox-control lightbox-prev"
        aria-label="Previous photo"
        @click.stop="showPrevious"
      >
        <v-icon size="28">mdi-chevron-left</v-icon>
      </button>

      <figure class="lightbox-stage" @click.stop>
        <img
          v-if="currentPhoto"
          :key="currentPhoto.id"
          :src="photoSrc(currentPhoto, 1600)"
          :srcset="photoSrcset(currentPhoto)"
          sizes="92vw"
          :alt="currentPhoto.altText ?? ''"
          class="lightbox-image"
        >
      </figure>

      <button
        v-if="hasMultiple"
        class="lightbox-control lightbox-next"
        aria-label="Next photo"
        @click.stop="showNext"
      >
        <v-icon size="28">mdi-chevron-right</v-icon>
      </button>

      <div v-if="hasMultiple" class="lightbox-counter font-nav tracking-wide text-caption">
        {{ index + 1 }} / {{ photos.length }}
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { photoSrc, photoSrcset, type PortfolioPhoto } from '@/utils/photoUrls'

const props = defineProps<{
  modelValue: boolean
  photos: PortfolioPhoto[]
  index: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:index': [value: number]
}>()

const currentPhoto = computed(() => props.photos[props.index])
const hasMultiple = computed(() => props.photos.length > 1)

function close() {
  emit('update:modelValue', false)
}

function showPrevious() {
  emit('update:index', (props.index - 1 + props.photos.length) % props.photos.length)
}

function showNext() {
  emit('update:index', (props.index + 1) % props.photos.length)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') showPrevious()
  else if (event.key === 'ArrowRight') showNext()
}

// Escape-to-close and focus trapping come from v-dialog itself; only arrow-key
// navigation needs a listener, and only while the lightbox is actually open.
watch(() => props.modelValue, open => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
:global(.lightbox-content) {
  box-shadow: none;
}

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 8, 9, 0.97);
}

.lightbox-stage {
  margin: 0;
  max-width: 92vw;
  max-height: 88vh;
  display: flex;
}

.lightbox-image {
  max-width: 92vw;
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
  box-shadow: 0 24px 80px -12px rgba(0, 0, 0, 0.6);
  animation: lightbox-fade-in 0.25s ease;
}

@keyframes lightbox-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.lightbox-control {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.lightbox-control:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.lightbox-close {
  top: 24px;
  right: 24px;
}

.lightbox-prev {
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
}

.lightbox-next {
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
}

.lightbox-counter {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.65);
}

@media (max-width: 600px) {
  .lightbox-prev {
    left: 8px;
  }

  .lightbox-next {
    right: 8px;
  }

  .lightbox-close {
    top: 12px;
    right: 12px;
  }
}
</style>
