<template>
  <div>
    <span class="font-nav tracking-widest text-blush text-caption text-uppercase d-block mb-2">Cover photo</span>

    <div class="d-flex align-center ga-4">
      <div class="cover-preview">
        <ResponsivePhoto v-if="selectedPhoto" :photo="selectedPhoto" :sizes="'160px'" aspect-ratio="1.5" />
        <div v-else class="cover-empty d-flex align-center justify-center text-center text-caption text-stone pa-2">
          {{ modelValue ? 'Photo unavailable' : fallbackLabel }}
        </div>
      </div>

      <div class="d-flex flex-column ga-2">
        <v-btn variant="outlined" color="charcoal" rounded="0" size="small" class="font-nav tracking-wide text-caption"
          prepend-icon="mdi-image-search-outline" @click="dialog = true">
          {{ modelValue ? 'Change photo' : 'Choose photo' }}
        </v-btn>
        <v-btn v-if="modelValue" variant="text" color="stone" rounded="0" size="small" class="font-nav tracking-wide text-caption"
          @click="emit('update:modelValue', null)">
          Use default
        </v-btn>
      </div>
    </div>

    <v-dialog v-model="dialog" max-width="960" scrollable>
      <v-card color="surface" rounded="0">
        <v-toolbar color="ivory-deep">
          <v-toolbar-title>
            <span class="font-display text-h5 text-charcoal">Choose a cover photo</span>
          </v-toolbar-title>
          <v-btn icon="mdi-close" color="stone" @click="dialog = false"></v-btn>
        </v-toolbar>
        <v-divider color="stone-light" />

        <div class="px-4 pt-4">
          <v-chip-group v-model="category" selected-class="text-charcoal" mandatory>
            <v-chip v-for="option in categoryOptions" :key="option.slug" :value="option.slug" variant="outlined" rounded="0" size="small" class="font-nav">
              {{ option.name }}
            </v-chip>
          </v-chip-group>
        </div>

        <v-card-text class="pa-4">
          <v-row v-if="!photos.loaded">
            <v-col v-for="n in 6" :key="n" cols="6" sm="4"><v-skeleton-loader type="image" color="transparent" /></v-col>
          </v-row>
          <p v-else-if="!visiblePhotos.length" class="text-body-2 text-stone py-6 text-center">
            No photos in this category yet. Upload some on the Photos page.
          </p>
          <v-row v-else dense>
            <v-col v-for="photo in visiblePhotos" :key="photo.id" cols="6" sm="4" md="3">
              <button type="button" class="cover-option" :class="{ 'cover-option--selected': photo.id === modelValue }"
                :aria-pressed="photo.id === modelValue" @click="choose(photo.id)">
                <ResponsivePhoto :photo="photo" :sizes="PHOTO_SIZES.tile" aspect-ratio="1.5" />
              </button>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { usePhotoStore } from '@/store/photos'
import { PHOTO_SIZES } from '@/utils/photoUrls'
import { PORTFOLIO_CATEGORIES, SITE_ONLY_CATEGORY } from '@/utils/portfolioCategories'

const props = defineProps<{
  /** Photo id, or null to fall back to the portfolio category's cover */
  modelValue: string | null
  /** Portfolio category the session falls back to, and the picker opens on */
  portfolioCategory?: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [photoId: string | null] }>()

const photos = usePhotoStore()
photos.load()

const dialog = ref(false)
const categoryOptions = [...PORTFOLIO_CATEGORIES, SITE_ONLY_CATEGORY]
const category = ref<string>(props.portfolioCategory ?? PORTFOLIO_CATEGORIES[0].slug)

const selectedPhoto = computed(() => props.modelValue
  ? photos.photos.find(p => p.id === props.modelValue)
  : (props.portfolioCategory ? photos.coverFor(props.portfolioCategory) : undefined))
const fallbackLabel = computed(() => props.portfolioCategory ? 'No photos in this category' : 'Default cover')
const visiblePhotos = computed(() => photos.byCategory(category.value) ?? [])

// Open on the chosen photo's category, else the session's
watch(dialog, open => {
  if (!open) return
  const current = props.modelValue ? photos.photos.find(p => p.id === props.modelValue) : undefined
  category.value = current?.category ?? props.portfolioCategory ?? category.value
})

function choose(photoId: string) {
  emit('update:modelValue', photoId)
  dialog.value = false
}
</script>

<style scoped>
.cover-preview {
  width: 160px;
  flex: 0 0 160px;
}

.cover-empty {
  aspect-ratio: 1.5;
  border: 1px dashed rgba(var(--v-theme-charcoal), 0.2);
}

.cover-option {
  display: block;
  width: 100%;
  padding: 0;
  border: 2px solid transparent;
  background: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.cover-option:hover {
  border-color: rgba(var(--v-theme-charcoal), 0.35);
}

.cover-option--selected {
  border-color: rgb(var(--v-theme-charcoal));
}
</style>
