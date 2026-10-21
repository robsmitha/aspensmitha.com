<template>
  <div>
    <!-- Upload straight into the collection or story being viewed -->
    <div
      class="drop-zone d-flex flex-column align-center justify-center text-center pa-6 mb-4"
      :class="{ 'drop-zone--active': dragging }"
      role="button"
      tabindex="0"
      :aria-label="`Add photos to ${label}`"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
      @keydown.enter.prevent="fileInput?.click()"
      @keydown.space.prevent="fileInput?.click()"
    >
      <v-icon size="28" color="stone">mdi-image-plus-outline</v-icon>
      <span class="font-display text-charcoal mt-2">Add photos to {{ label }}</span>
      <span class="text-caption text-stone">Drop originals here or click to choose &mdash; JPG, PNG, TIFF or WebP, full resolution is best</span>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.tif,.tiff,.webp"
        class="d-none"
        @change="onPick"
      />
    </div>

    <p v-if="!photos.length" class="font-display text-stone empty-state py-8 text-center">
      No photos in {{ label }} yet.
    </p>

    <div v-if="photos.length > 1" class="d-flex flex-wrap align-center justify-space-between ga-2 mb-2">
      <p class="text-caption text-stone mb-0">
        Press and hold a photo, then drag to reorder. Click to edit.
      </p>
      <v-btn
        v-if="previewable"
        variant="text"
        size="small"
        color="charcoal"
        rounded="0"
        class="font-nav tracking-wide text-caption"
        :prepend-icon="showPreview ? 'mdi-eye-off-outline' : 'mdi-view-quilt-outline'"
        :aria-pressed="showPreview"
        @click="togglePreview"
      >
        {{ showPreview ? 'Hide' : 'Show' }} gallery preview
      </v-btn>
    </div>

    <v-row dense>
      <!-- Always rendered (only its width changes) so the Sortable grid inside is never rebuilt -->
      <v-col cols="12" :md="previewVisible ? 7 : 12">
        <!-- Plain element rather than v-row so Sortable can own it; press and hold a tile to drag -->
        <div ref="grid" class="v-row v-row--dense">
          <v-col
            v-for="(photo, index) in photos"
            :key="photo.id"
            cols="6"
            :sm="previewVisible ? 6 : 4"
            :lg="previewVisible ? 4 : 3"
          >
            <div
              class="tile"
              :class="{ 'tile--selected': editingId === photo.id }"
              role="button"
              tabindex="0"
              :aria-label="`Edit ${photo.originalFileName}. Alt plus arrow keys to reorder`"
              @click="onTileClick(photo)"
              @keydown.enter="openEditor(photo)"
              @keydown.alt.left.prevent="index > 0 && reorder(index, index - 1)"
              @keydown.alt.right.prevent="index < photos.length - 1 && reorder(index, index + 1)"
            >
              <v-img
                v-if="photo.srcBase"
                :src="`${photo.srcBase}/${managedPhotoWidth(photo)}.webp`"
                :lazy-src="photo.placeholder ?? undefined"
                aspect-ratio="0.8"
                cover
                :position="`${photo.focusX * 100}% ${photo.focusY * 100}%`"
              ></v-img>
              <div v-else class="tile__pending d-flex flex-column align-center justify-center text-center pa-4">
                <template v-if="isStuck(photo) || photo.status === 'Failed'">
                  <v-icon :color="photo.status === 'Failed' ? 'error' : 'stone'" size="28">
                    {{ photo.status === 'Failed' ? 'mdi-image-broken-variant' : 'mdi-timer-sand' }}
                  </v-icon>
                  <span class="text-caption text-stone mt-2">
                    {{ photo.status === 'Failed' ? 'Processing failed' : 'Waiting to process' }}
                  </span>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="blush"
                    rounded="0"
                    class="font-nav tracking-wide text-caption mt-3"
                    :loading="busy[photo.id] === 'reprocess'"
                    @click.stop="reprocess(photo)"
                  >
                    Reprocess
                  </v-btn>
                </template>
                <v-progress-circular v-else indeterminate size="28" width="2" color="stone"></v-progress-circular>
              </div>

              <div class="tile__badges">
                <span
                  v-if="photo.status !== 'Ready'"
                  class="tile__badge"
                  :class="photo.status === 'Failed' ? 'tile__badge--error' : 'tile__badge--muted'"
                >
                  {{ isStuck(photo) ? 'Waiting' : photo.status }}
                </span>
                <span v-if="hero && photo.id === hero.id" class="tile__badge tile__badge--hero">
                  <v-icon size="11" class="mr-1">mdi-star</v-icon>Hero
                </span>
                <v-spacer></v-spacer>
                <span
                  v-if="photo.placements.length"
                  class="tile__badge tile__badge--featured"
                  :title="photo.placements.map(placementTitle).join('\n')"
                >
                  <v-icon size="11" class="mr-1">mdi-pin</v-icon>{{ placementBadge(photo) }}
                </span>
              </div>

              <!-- Hover tools (always visible on touch screens) -->
              <div class="tile__tools" @click.stop>
                <v-icon size="18" color="ivory" class="tile__grip" aria-hidden="true">mdi-drag</v-icon>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="story && photo.status === 'Ready' && photo.id !== hero?.id"
                  icon="mdi-star-outline"
                  size="x-small"
                  variant="flat"
                  color="ivory"
                  rounded="0"
                  aria-label="Use as hero photo"
                  title="Use as hero photo"
                  @click="emit('set-hero', photo.id)"
                ></v-btn>
                <v-btn
                  icon="mdi-pencil-outline"
                  size="x-small"
                  variant="flat"
                  color="ivory"
                  rounded="0"
                  aria-label="Edit details"
                  @click="openEditor(photo)"
                ></v-btn>
              </div>
            </div>
            <p class="tile__caption text-caption text-truncate mt-1 mb-2" :title="photo.originalFileName">
              <span v-if="previewVisible" class="text-charcoal font-weight-medium mr-1">{{ index + 1 }}.</span>
              <span v-if="photo.altText" class="text-charcoal">{{ photo.altText }}</span>
              <span v-else class="text-stone">{{ photo.originalFileName }}</span>
            </p>
          </v-col>
        </div>
      </v-col>

      <!-- Live preview of the public masonry gallery, laid out by the same code as the site -->
      <v-col v-if="previewVisible" cols="12" md="5">
        <aside class="preview" aria-label="Gallery preview">
          <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-3">
            <span class="font-nav tracking-widest text-caption text-stone text-uppercase">Gallery preview</span>
            <v-btn-toggle
              v-model="previewColumns"
              mandatory
              density="compact"
              variant="outlined"
              rounded="0"
              color="charcoal"
              divided
            >
              <v-btn :value="3" size="small" class="font-nav text-caption">Desktop</v-btn>
              <v-btn :value="2" size="small" class="font-nav text-caption">Tablet</v-btn>
            </v-btn-toggle>
          </div>

          <p v-if="!previewLayout.some(column => column.length)" class="text-caption text-stone">
            Photos appear here once they finish processing.
          </p>
          <div v-else class="preview__masonry">
            <div v-for="(column, c) in previewLayout" :key="c" class="preview__column">
              <button
                v-for="{ item } in column"
                :key="item.photo.id"
                type="button"
                class="preview__item"
                :class="{ 'preview__item--selected': editingId === item.photo.id }"
                :aria-label="`Edit photo ${item.number}, ${item.photo.originalFileName}`"
                @click="openEditor(item.photo)"
              >
                <v-img
                  :src="`${item.photo.srcBase}/${managedPhotoWidth(item.photo, 240)}.webp`"
                  :lazy-src="item.photo.placeholder ?? undefined"
                  :aspect-ratio="1 / aspectHeight(item)"
                  cover
                ></v-img>
                <span class="preview__number">{{ item.number }}</span>
              </button>
            </div>
          </div>

          <p class="text-caption text-stone mt-3 mb-0">
            Numbers match the order on the left. Photos still processing aren't shown. Phones show one column in this same order.
          </p>
        </aside>
      </v-col>
    </v-row>

    <!-- Details panel -->
    <v-navigation-drawer
      v-model="editorOpen"
      location="right"
      temporary
      :width="xs ? displayWidth : 440"
      color="surface"
      class="editor"
    >
      <template v-if="editing">
        <div class="d-flex align-start justify-space-between ga-2 px-5 pt-5 pb-4">
          <div class="editor__title">
            <span class="font-nav tracking-widest text-caption text-blush text-uppercase">Photo details</span>
            <h3 class="font-display text-charcoal editor__filename text-truncate" :title="editing.originalFileName">
              {{ editing.originalFileName }}
            </h3>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" color="charcoal" aria-label="Close" @click="closeEditor"></v-btn>
        </div>
        <v-divider color="stone-light"></v-divider>

        <div class="pa-5">
          <!-- Uncropped, so a click maps to the real image -->
          <div v-if="editing.srcBase" class="focus-picker" @click="setFocus(editing, $event)">
            <v-img
              :src="`${editing.srcBase}/${managedPhotoWidth(editing, 800)}.webp`"
              :lazy-src="editing.placeholder ?? undefined"
              :aspect-ratio="editing.width && editing.height ? editing.width / editing.height : 0.8"
            ></v-img>
            <span
              class="focus-picker__marker"
              :style="{ left: `${editingDraft!.focusX * 100}%`, top: `${editingDraft!.focusY * 100}%` }"
            ></span>
          </div>
          <div v-else class="focus-picker__pending d-flex align-center justify-center">
            <v-progress-circular v-if="isPending(editing) && !isStuck(editing)" indeterminate color="stone"></v-progress-circular>
            <v-icon v-else color="stone" size="32">mdi-image-off-outline</v-icon>
          </div>

          <template v-if="editing.srcBase">
            <p class="text-caption text-stone mt-2 mb-3">Click the photo to set its focal point. Crops keep it in frame:</p>
            <div class="d-flex ga-2 mb-6">
              <div v-for="crop in CROP_PREVIEWS" :key="crop.label" class="crop-preview" :style="{ flex: crop.flex }">
                <v-img
                  :src="`${editing.srcBase}/${managedPhotoWidth(editing, 400)}.webp`"
                  :aspect-ratio="crop.ratio"
                  cover
                  :position="`${editingDraft!.focusX * 100}% ${editingDraft!.focusY * 100}%`"
                ></v-img>
                <span class="text-caption text-stone">{{ crop.label }}</span>
              </div>
            </div>
          </template>

          <div v-if="editing.status !== 'Ready'" class="editor__status mb-6">
            <v-chip :color="statusColor(editing.status)" size="small" label class="mb-2">
              {{ isStuck(editing) ? 'Waiting' : editing.status }}
            </v-chip>
            <p v-if="editing.processingError" class="text-caption text-error mb-0">{{ editing.processingError }}</p>
            <p v-else-if="isStuck(editing)" class="text-caption text-stone mb-0">Press Reprocess to run processing now.</p>
          </div>

          <!-- A story's hero is chosen here or with the star on a tile -->
          <div v-if="story && editing.status === 'Ready'" class="d-flex align-center ga-3 mb-5">
            <template v-if="hero?.id === editing.id">
              <v-icon color="blush-dark" size="18">mdi-star</v-icon>
              <span class="text-body-2 text-charcoal">This is the story&rsquo;s hero photo</span>
            </template>
            <v-btn
              v-else
              variant="outlined"
              color="charcoal"
              rounded="0"
              prepend-icon="mdi-star-outline"
              class="font-nav tracking-wide text-caption"
              @click="emit('set-hero', editing.id)"
            >
              Use as Hero Photo
            </v-btn>
          </div>

          <v-textarea
            v-model="editingDraft!.altText"
            label="Alt text"
            :hint="story ? `Describe the photo for screen readers and search engines. Left blank, it reads &quot;${story.title}, photo ${photos.indexOf(editing) + 1} of ${photos.length}&quot;.` : 'Describe the photo for screen readers and search engines'"
            persistent-hint
            variant="outlined"
            rounded="0"
            rows="2"
            auto-grow
            class="mb-4"
          ></v-textarea>
          <v-select
            v-if="!story"
            v-model="editingDraft!.category"
            :items="categoryItems"
            label="Collection"
            variant="outlined"
            rounded="0"
            class="mb-4"
            hide-details
          ></v-select>
          <v-select
            v-model="editingDraft!.placements"
            :items="placementItems"
            label="Featured on the site"
            placeholder="Not featured"
            persistent-placeholder
            multiple
            chips
            closable-chips
            variant="outlined"
            rounded="0"
            hide-details
            :menu-props="{ maxWidth: 400 }"
            class="mb-5"
          >
            <template #chip="{ item, props: chipProps }">
              <v-chip v-bind="chipProps" size="small" color="blush" variant="tonal" label>
                {{ placementTitle(item.value) }}
              </v-chip>
            </template>
            <template #item="{ item, props: itemProps, index }">
              <v-list-subheader
                v-if="index === 0 || placementItems[index - 1].page !== item.raw.page"
                class="font-nav tracking-widest text-caption text-uppercase"
              >
                {{ item.raw.pageName }}
              </v-list-subheader>
              <v-list-item v-bind="itemProps" :title="item.raw.title" class="placement-option">
                <template #prepend="{ isSelected }">
                  <v-checkbox-btn :model-value="isSelected" color="blush" density="compact"></v-checkbox-btn>
                </template>
                <v-list-item-subtitle
                  v-if="placementHolder(item.raw.value) && placementHolder(item.raw.value)!.id !== editing.id"
                  class="placement-option__taken"
                >
                  Currently {{ placementHolder(item.raw.value)!.originalFileName }}; choosing this replaces it
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <!-- Home/Portfolio spots are published as fixed-size crops; warn when this photo can't fill one sharply -->
          <p
            v-for="warning in lowResolutionWarnings(editing, editingDraft!.placements)"
            :key="warning"
            class="text-caption where__none mb-3"
          >
            <v-icon size="14" class="mr-1">mdi-alert-outline</v-icon>{{ warning }}
          </p>

          <!-- Where this photo appears on the public site; updates live as the fields change -->
          <section class="where mb-6" aria-label="Where this photo appears">
            <span class="font-nav tracking-widest text-caption text-stone text-uppercase d-block mb-3">
              Where this photo appears
            </span>

            <div v-for="group in placementsByPage(editingDraft!.placements)" :key="group.page" class="d-flex ga-3 mb-3">
              <PlacementMap v-if="group.page !== 'site'" :page="group.page" :highlight="group.placements.map(p => p.area)" />
              <div class="where__detail">
                <div class="d-flex align-center ga-2">
                  <span class="font-display text-charcoal where__page">{{ group.page === 'site' ? group.name : `${group.name} page` }}</span>
                  <a v-if="group.page !== 'site'" :href="group.path" target="_blank" class="font-nav text-caption text-blush where__link">View &#8599;</a>
                </div>
                <ul class="where__spots text-caption text-stone">
                  <li v-for="placement in group.placements" :key="placement.key">{{ placement.label }}</li>
                </ul>
              </div>
            </div>

            <div v-if="story" class="d-flex align-center ga-2 text-caption">
              <v-icon size="16" color="stone">mdi-book-open-page-variant-outline</v-icon>
              <span class="text-charcoal">Story &rsaquo; {{ story.title }}</span>
              <a v-if="story.href" :href="story.href" target="_blank" class="font-nav text-blush where__link">View &#8599;</a>
            </div>
            <div v-else-if="galleryFor(editingDraft!.category)" class="d-flex align-center ga-2 text-caption">
              <v-icon size="16" color="stone">mdi-view-grid-outline</v-icon>
              <span class="text-charcoal">Portfolio &rsaquo; {{ galleryFor(editingDraft!.category)!.name }} gallery</span>
              <a :href="`/portfolio/${editingDraft!.category}`" target="_blank" class="font-nav text-blush where__link">View &#8599;</a>
            </div>

            <p
              v-if="!story && !editingDraft!.placements.length && !galleryFor(editingDraft!.category)"
              class="where__none text-caption mb-0"
            >
              Not shown anywhere yet. Pick spots under "Featured on the site" to use it.
            </p>
          </section>

          <dl class="editor__meta text-caption">
            <template v-if="editing.width && editing.height">
              <dt class="text-stone">Dimensions</dt>
              <dd class="text-charcoal">{{ editing.width }} &times; {{ editing.height }}</dd>
            </template>
            <dt class="text-stone">Original size</dt>
            <dd class="text-charcoal">{{ formatBytes(editing.originalFileSize) }}</dd>
            <dt class="text-stone">Uploaded</dt>
            <dd class="text-charcoal">{{ new Date(editing.createdAt).toLocaleDateString() }}</dd>
          </dl>
        </div>
      </template>

      <template v-if="editing" #append>
        <v-divider color="stone-light"></v-divider>
        <div class="d-flex align-center ga-2 pa-4">
          <v-btn
            variant="text"
            color="error"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            :loading="busy[editing.id] === 'delete'"
            @click="confirmingDelete === editing.id ? remove(editing) : (confirmingDelete = editing.id)"
          >
            {{ confirmingDelete === editing.id ? 'Confirm delete' : 'Delete' }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="charcoal"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            :loading="busy[editing.id] === 'reprocess'"
            @click="reprocess(editing)"
          >
            Reprocess
          </v-btn>
          <v-btn
            variant="flat"
            color="charcoal"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            :disabled="!isDirty(editing)"
            :loading="busy[editing.id] === 'save'"
            @click="save(editing)"
          >
            Save
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Upload tray: docked bottom-right, collapsible, fades away after a clean batch -->
    <v-slide-y-reverse-transition>
      <v-card
        v-if="uploads.length"
        rounded="0"
        class="tray"
        :class="{ 'tray--mobile': xs }"
        :style="!xs && editorOpen ? { right: '464px' } : undefined"
        role="status"
        aria-live="polite"
      >
        <div class="tray__header d-flex align-center ga-2 pl-4 pr-2 py-2">
          <span class="font-nav tracking-wide text-caption text-charcoal flex-grow-1">{{ trayTitle }}</span>
          <v-btn
            :icon="trayCollapsed ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            variant="text"
            size="small"
            color="charcoal"
            :aria-label="trayCollapsed ? 'Show uploads' : 'Hide uploads'"
            @click="trayCollapsed = !trayCollapsed"
          ></v-btn>
          <v-btn
            v-if="!uploadsActive"
            icon="mdi-close"
            variant="text"
            size="small"
            color="charcoal"
            aria-label="Close"
            @click="clearUploads"
          ></v-btn>
        </div>
        <v-progress-linear
          v-if="uploadsActive"
          :model-value="trayProgress"
          color="blush"
          bg-color="stone-light"
          height="2"
        ></v-progress-linear>

        <v-expand-transition>
          <div v-show="!trayCollapsed" class="tray__list">
            <div v-for="u in uploads" :key="u.key" class="tray__row">
              <v-icon size="18" color="stone" class="flex-shrink-0">mdi-image-outline</v-icon>
              <div class="tray__file">
                <span class="tray__name text-body-2 text-charcoal" :title="u.fileName">{{ u.fileName }}</span>
                <span v-if="u.error" class="tray__error text-caption">{{ u.error }}</span>
              </div>
              <span class="tray__status">
                <span v-if="u.status === 'queued'" class="text-caption text-stone">Waiting</span>
                <v-progress-circular
                  v-else-if="u.status === 'uploading'"
                  :model-value="u.progress"
                  size="24"
                  width="2"
                  color="blush"
                >
                  <span class="tray__percent">{{ u.progress }}</span>
                </v-progress-circular>
                <v-icon v-else-if="u.status === 'done'" size="20" color="success" aria-label="Uploaded">mdi-check-circle</v-icon>
                <v-icon v-else size="20" color="error" aria-label="Failed">mdi-alert-circle</v-icon>
              </span>
            </div>
          </div>
        </v-expand-transition>
      </v-card>
    </v-slide-y-reverse-transition>

    <v-snackbar v-model="snackbar" color="error" timeout="8000">{{ errorMessage }}</v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { BlockBlobClient } from '@azure/storage-blob'
import Sortable from 'sortablejs'
import apiClient from '@/api/elysianClient'
import PlacementMap from '@/components/Admin/PlacementMap.vue'
import { PORTFOLIO_CATEGORIES, SITE_ONLY_CATEGORY } from '@/utils/portfolioCategories'
import { SITE_PAGES, SITE_PLACEMENTS, placementTitle, placementsByPage } from '@/utils/sitePlacements'
import { placementSlot } from '@/utils/placementImages'
import { managedPhotoWidth, type ManagedPhoto } from '@/utils/managedPhotos'
import { aspectHeight, masonryColumns } from '@/utils/masonry'

/**
 * Upload, reorder and edit one set of photos: a portfolio collection, or a
 * story's photos. The parent owns the list and reloads it through `refresh`;
 * this keeps unsaved edits across reloads.
 */
const props = withDefaults(defineProps<{
  /** The photos shown, in display order */
  photos: ManagedPhoto[]
  /** Every photo the parent knows of, to say which one fills a site spot */
  allPhotos?: ManagedPhoto[]
  /** Where new uploads go */
  uploadTarget: { category: string } | { storyId: string }
  /** Shown as "Add photos to {label}" */
  label: string
  /** Reloads the parent's photos */
  refresh: () => Promise<void>
  /** Story mode: hides the collection field and adds hero controls */
  story?: { title: string, heroPhotoId: string | null, href?: string }
  /** Offer the side-by-side preview of the public masonry gallery */
  previewable?: boolean
}>(), {
  allPhotos: undefined,
  story: undefined,
  previewable: false,
})

const emit = defineEmits<{
  /** A photo changed on the server (save, reprocess) */
  replace: [photo: ManagedPhoto]
  /** A photo was deleted */
  remove: [photoId: string]
  'set-hero': [photoId: string]
  /** Something was saved that can change what a site spot shows (the page refreshes its publish status) */
  changed: []
}>()

interface Draft {
  altText: string | null
  placements: string[]
  category: string
  focusX: number
  focusY: number
}

interface Upload {
  key: string
  fileName: string
  progress: number
  status: 'queued' | 'uploading' | 'done' | 'error'
  error?: string
}

const POLL_MS = 4000
/** Uploaded/Processing longer than this is treated as stuck and offers Reprocess */
const STUCK_AFTER_MS = 30_000
/** Stop polling once every pending photo has been stuck this long */
const STOP_POLLING_AFTER_MS = 5 * 60_000
/**
 * Event Grid (which starts processing in Azure) can't reach a dev machine, so
 * in dev the page triggers processing itself once an upload finishes.
 */
const PROCESS_AFTER_UPLOAD = import.meta.env.DEV

const categoryItems = [...PORTFOLIO_CATEGORIES, SITE_ONLY_CATEGORY].map(c => ({ title: c.name, value: c.slug }))
const placementItems = SITE_PLACEMENTS.map(p => ({
  title: p.label,
  value: p.key,
  page: p.page,
  pageName: SITE_PAGES[p.page].name,
}))

/**
 * How the chosen focal point plays out in the site's crops. Home and Portfolio
 * spots are published cropped to exactly these shapes (content/placementSlots.json).
 */
const CROP_PREVIEWS = [
  { label: 'Hero strip', ratio: 0.75, flex: '0.75' },
  { label: 'Portrait', ratio: 0.8, flex: '0.8' },
  { label: 'Banner', ratio: 2.2, flex: '2.2' },
]

/**
 * Spots whose largest published size this photo can't fill: the crop to the
 * spot's shape is narrower than that size, so it's shown softer on sharp screens
 */
function lowResolutionWarnings(photo: ManagedPhoto, placements: readonly string[]): string[] {
  if (!photo.width || !photo.height) return []
  const width = photo.width
  const height = photo.height
  return placements.flatMap(key => {
    const slot = placementSlot(key)
    if (!slot) return []
    const cropWidth = width / height > slot.ratio ? Math.round(height * slot.ratio) : width
    const largest = slot.widths[slot.widths.length - 1]
    return cropWidth < largest
      ? [`${placementTitle(key)}: this photo crops to ${cropWidth}px wide; ${largest}px or more looks sharpest.`]
      : []
  })
}

const { xs, width: displayWidth } = useDisplay()

const drafts = reactive<Record<string, Draft>>({})
const busy = reactive<Record<string, string | undefined>>({})
const uploads = ref<Upload[]>([])
const trayCollapsed = ref(false)
/** A clean batch leaves the tray up this long before it clears itself */
const TRAY_DISMISS_MS = 4000
let trayTimer: ReturnType<typeof setTimeout> | undefined

const dragging = ref(false)
const confirmingDelete = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()
const snackbar = ref(false)
const errorMessage = ref('')
const now = ref(Date.now())
let pollTimer: ReturnType<typeof setTimeout> | undefined

/** The story's hero: the chosen photo, else its first ready one (what the public page shows) */
const hero = computed(() => {
  if (!props.story) return undefined
  return props.photos.find(p => p.id === props.story!.heroPhotoId && p.status === 'Ready')
    ?? props.photos.find(p => p.status === 'Ready')
})

const uploadsActive = computed(() => uploads.value.some(u => u.status === 'queued' || u.status === 'uploading'))
const uploadsFailed = computed(() => uploads.value.filter(u => u.status === 'error').length)
const uploadsDone = computed(() => uploads.value.filter(u => u.status === 'done').length)
const trayProgress = computed(() =>
  uploads.value.reduce((sum, u) => sum + (u.status === 'queued' ? 0 : u.status === 'uploading' ? u.progress : 100), 0)
  / Math.max(1, uploads.value.length))
const trayTitle = computed(() => {
  const total = uploads.value.length
  if (uploadsActive.value) {
    const current = Math.min(total, uploadsDone.value + uploadsFailed.value + 1)
    return `Uploading ${current} of ${total}`
  }
  if (uploadsFailed.value) return `${uploadsDone.value} uploaded · ${uploadsFailed.value} failed`
  return `${total} upload${total === 1 ? '' : 's'} complete`
})

function clearUploads() {
  clearTimeout(trayTimer)
  uploads.value = []
  trayCollapsed.value = false
}

// A clean batch clears itself; failures stay until closed so they aren't missed
watch(uploadsActive, active => {
  clearTimeout(trayTimer)
  if (!active && uploads.value.length && !uploadsFailed.value) {
    trayTimer = setTimeout(clearUploads, TRAY_DISMISS_MS)
  }
})

// Switching collections clears a finished tray
watch(() => JSON.stringify(props.uploadTarget), () => {
  if (!uploadsActive.value) clearUploads()
})

const shouldPoll = computed(() => props.photos.some(p => isPending(p) && pendingFor(p) < STOP_POLLING_AFTER_MS))

function isPending(photo: ManagedPhoto) {
  return photo.status === 'Uploaded' || photo.status === 'Processing'
}

function pendingFor(photo: ManagedPhoto) {
  return now.value - Date.parse(photo.createdAt)
}

function isStuck(photo: ManagedPhoto) {
  return isPending(photo) && !busy[photo.id] && pendingFor(photo) > STUCK_AFTER_MS
}

function statusColor(status: ManagedPhoto['status']) {
  return { Uploaded: 'stone', Processing: 'blush', Ready: 'success', Failed: 'error' }[status]
}

/** One spot: "Home › Intro portrait…"; several: "3 spots" */
function placementBadge(photo: ManagedPhoto) {
  return photo.placements.length === 1 ? placementTitle(photo.placements[0]) : `${photo.placements.length} spots`
}

/** The photo currently filling a spot, if any */
function placementHolder(key: string) {
  return (props.allPhotos ?? props.photos).find(p => p.placements.includes(key))
}

/** Portfolio categories show their photos in a public gallery; "Site only" doesn't */
function galleryFor(category: string) {
  return PORTFOLIO_CATEGORIES.find(c => c.slug === category)
}

function sameSet(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every(x => b.includes(x))
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// ---- Details panel
const editingId = ref<string | null>(null)
const editing = computed(() => props.photos.find(p => p.id === editingId.value))
const editingDraft = computed(() => (editing.value ? drafts[editing.value.id] : undefined))
const editorOpen = computed({
  get: () => !!editing.value,
  set: open => { if (!open) closeEditor() },
})

function openEditor(photo: ManagedPhoto) {
  confirmingDelete.value = null
  editingId.value = photo.id
}

/** Closing without saving discards the panel's edits */
function closeEditor() {
  if (editing.value) drafts[editing.value.id] = toDraft(editing.value)
  confirmingDelete.value = null
  editingId.value = null
}

function showError(message: string | undefined) {
  errorMessage.value = message || 'An error occurred. Please try again later.'
  snackbar.value = true
}

function toDraft(photo: ManagedPhoto): Draft {
  return {
    altText: photo.altText,
    placements: [...photo.placements],
    category: photo.category,
    focusX: photo.focusX,
    focusY: photo.focusY,
  }
}

function isDirty(photo: ManagedPhoto, draft = drafts[photo.id]) {
  return !!draft && (
    (draft.altText ?? '') !== (photo.altText ?? '') ||
    !sameSet(draft.placements, photo.placements) ||
    draft.category !== photo.category ||
    draft.focusX !== photo.focusX ||
    draft.focusY !== photo.focusY
  )
}

// New photos get a draft; a reload keeps unsaved edits, and refreshes clean ones
let previous = new Map<string, ManagedPhoto>()
watch(() => props.photos, next => {
  for (const photo of next) {
    const old = previous.get(photo.id)
    if (!drafts[photo.id] || (old && !isDirty(old))) {
      drafts[photo.id] = toDraft(photo)
    }
  }
  previous = new Map(next.map(p => [p.id, { ...p }]))
  now.value = Date.now()
}, { immediate: true, deep: true })

function replacePhoto(updated: ManagedPhoto) {
  emit('replace', updated)
  drafts[updated.id] = toDraft(updated)
}

// Poll only while something is recently uploaded/processing; long-stuck photos show a Reprocess prompt instead
watch(shouldPoll, poll => {
  clearTimeout(pollTimer)
  if (poll) schedulePoll()
}, { immediate: true })

function schedulePoll() {
  pollTimer = setTimeout(async () => {
    // Re-rendering the grid mid-drag would pull tiles out from under Sortable
    if (!sorting.value) await props.refresh()
    now.value = Date.now()
    if (shouldPoll.value) schedulePoll()
  }, POLL_MS)
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  uploadFiles(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  uploadFiles(Array.from(event.dataTransfer?.files ?? []))
}

async function uploadFiles(files: File[]) {
  if (!files.length) return
  const target = { ...props.uploadTarget }

  // A new batch replaces a finished tray; files dropped mid-batch join the current one
  if (!uploadsActive.value) clearUploads()
  const batch = files.map((file, i) => ({
    file,
    upload: reactive<Upload>({ key: `${file.name}-${Date.now()}-${i}`, fileName: file.name, progress: 0, status: 'queued' }),
  }))
  uploads.value.push(...batch.map(b => b.upload))

  // Sequential keeps the order Aspen dropped them in and avoids saturating her connection
  const uploaded: string[] = []
  for (const { file, upload } of batch) {
    const photoId = await uploadFile(file, target, upload)
    if (photoId) uploaded.push(photoId)
  }
  await props.refresh()

  if (PROCESS_AFTER_UPLOAD) {
    for (const photoId of uploaded) {
      const photo = props.photos.find(p => p.id === photoId)
      if (photo && isPending(photo)) await reprocess(photo)
    }
  }
}

/** Returns the new photo's id once its original is in storage */
async function uploadFile(file: File, target: PhotoManagerTarget, upload: Upload): Promise<string | undefined> {
  upload.status = 'uploading'

  const response = await apiClient.postData('/api/manage/photos/upload', {
    fileName: file.name,
    fileSize: file.size,
    category: 'category' in target ? target.category : '',
    storyId: 'storyId' in target ? target.storyId : null,
  })
  if (!response.success) {
    upload.status = 'error'
    // Just the validation messages, without the API's field names
    upload.error = response.errors
      ? [...response.errors.values()].flat().join(' ')
      : response.errorMessage ?? 'Could not start upload'
    return undefined
  }

  try {
    // Straight to blob storage with a short-lived, write-only URL; processing starts when it lands
    await new BlockBlobClient(response.data.uploadUrl).uploadData(file, {
      blobHTTPHeaders: { blobContentType: file.type || 'application/octet-stream' },
      onProgress: p => { upload.progress = Math.round((p.loadedBytes / file.size) * 100) },
    })
    upload.progress = 100
    upload.status = 'done'
    return response.data.photoId
  } catch (error) {
    console.error('Upload failed', error)
    upload.status = 'error'
    upload.error = 'Upload failed'
    return undefined
  }
}

type PhotoManagerTarget = { category: string } | { storyId: string }

function setFocus(photo: ManagedPhoto, event: MouseEvent) {
  if (!photo.srcBase) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const clamp = (n: number) => Math.min(1, Math.max(0, Math.round(n * 100) / 100))
  drafts[photo.id].focusX = clamp((event.clientX - rect.left) / rect.width)
  drafts[photo.id].focusY = clamp((event.clientY - rect.top) / rect.height)
}

async function save(photo: ManagedPhoto) {
  busy[photo.id] = 'save'
  const d = drafts[photo.id]
  const response = await apiClient.postData('/api/manage/photos/update', {
    photoId: photo.id,
    category: d.category,
    altText: d.altText,
    focusX: d.focusX,
    focusY: d.focusY,
    placements: d.placements,
  })
  busy[photo.id] = undefined
  if (!response.success) {
    showError(response.errorMessage)
    return
  }
  emit('changed')
  // Taking a spot from another photo, or changing collection, affects other photos: reload everything
  if (!sameSet(d.placements, photo.placements) || d.category !== photo.category) {
    drafts[photo.id] = toDraft(response.data)
    await props.refresh()
  } else {
    replacePhoto(response.data)
  }
}

// ---- Gallery preview
const PREVIEW_STORAGE_KEY = 'admin.photos.galleryPreview'

function readPreviewSetting() {
  try {
    return localStorage.getItem(PREVIEW_STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

const showPreview = ref(readPreviewSetting())
const previewColumns = ref(3)
const previewVisible = computed(() => showPreview.value && props.previewable && props.photos.length > 1)

/** Same placement as the public gallery, which only shows processed photos */
const previewLayout = computed(() => masonryColumns(
  props.photos
    .map((photo, i) => ({ photo, number: i + 1, width: photo.width, height: photo.height }))
    .filter(x => x.photo.status === 'Ready' && x.photo.srcBase),
  previewColumns.value,
))

function togglePreview() {
  showPreview.value = !showPreview.value
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, showPreview.value ? 'on' : 'off')
  } catch {
    // Storage blocked: the toggle still works for this visit
  }
}

// ---- Drag to reorder
const grid = ref<HTMLElement>()
const sorting = ref(false)
/** A drag ends with a mouseup, which the browser follows with a click; this swallows it */
let suppressClick = false
let sortable: Sortable | undefined
let restoreBefore: Node | null = null

function onTileClick(photo: ManagedPhoto) {
  if (!suppressClick) openEditor(photo)
}

function initSortable() {
  sortable = Sortable.create(grid.value!, {
    // Press and hold starts a drag, so a quick click still opens the editor
    delay: 200,
    touchStartThreshold: 6,
    animation: 150,
    // Our own pointer handling: native drag-and-drop would light up the upload drop zone
    forceFallback: true,
    fallbackTolerance: 3,
    filter: '.v-btn',
    preventOnFilter: false,
    chosenClass: 'tile-col--chosen',
    ghostClass: 'tile-col--ghost',
    dragClass: 'tile-col--drag',
    onStart: e => {
      sorting.value = true
      restoreBefore = e.item.nextSibling
    },
    onEnd: e => {
      sorting.value = false
      suppressClick = true
      setTimeout(() => { suppressClick = false })
      // Put the DOM back where Vue left it and let the re-render do the move
      e.from.insertBefore(e.item, restoreBefore)
      restoreBefore = null
      if (e.oldIndex !== undefined && e.newIndex !== undefined && e.oldIndex !== e.newIndex) {
        reorder(e.oldIndex, e.newIndex)
      }
    },
  })
}

async function reorder(from: number, to: number) {
  const ordered = [...props.photos]
  const [item] = ordered.splice(from, 1)
  ordered.splice(to, 0, item)
  // The parent sorts by sortOrder, so updating it moves the tiles right away
  ordered.forEach((p, i) => { p.sortOrder = i })

  const response = await apiClient.postData('/api/manage/photos/reorder', { photoIds: ordered.map(p => p.id) })
  if (!response.success) {
    showError(response.errorMessage)
    await props.refresh()
    return
  }
  // A category's first photo is the fallback for its cover
  emit('changed')
}

async function reprocess(photo: ManagedPhoto) {
  busy[photo.id] = 'reprocess'
  const response = await apiClient.postData('/api/manage/photos/reprocess', { photoId: photo.id })
  busy[photo.id] = undefined
  if (!response.success) {
    showError(response.errorMessage)
    return
  }
  replacePhoto(response.data)
  emit('changed')
}

async function remove(photo: ManagedPhoto) {
  confirmingDelete.value = null
  busy[photo.id] = 'delete'
  const response = await apiClient.postData('/api/manage/photos/delete', { photoId: photo.id })
  busy[photo.id] = undefined
  if (!response.success) {
    showError(response.errorMessage)
    return
  }
  if (editingId.value === photo.id) editingId.value = null
  emit('remove', photo.id)
  emit('changed')
}

onMounted(initSortable)
onBeforeUnmount(() => {
  sortable?.destroy()
  clearTimeout(pollTimer)
  clearTimeout(trayTimer)
})
</script>

<style scoped>
.empty-state {
  font-size: 1.125rem;
}

.drop-zone {
  min-height: 120px;
  border: 1px dashed rgba(var(--v-theme-charcoal), 0.3);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.drop-zone:hover,
.drop-zone:focus-visible,
.drop-zone--active {
  background-color: rgb(var(--v-theme-ivory-deep));
  border-color: rgb(var(--v-theme-blush));
  outline: none;
}

.tray {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1010;
  width: 360px;
  border: 1px solid rgba(var(--v-theme-charcoal), 0.1);
  box-shadow: 0 18px 48px -16px rgba(33, 31, 28, 0.35);
  transition: right 0.25s ease;
}

.tray--mobile {
  right: 0;
  left: 0;
  bottom: 0;
  width: auto;
}

.tray__header {
  background-color: rgb(var(--v-theme-ivory-deep));
}

.tray__list {
  max-height: 264px;
  overflow-y: auto;
}

.tray__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid rgba(var(--v-theme-charcoal), 0.06);
}

.tray__file {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.tray__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tray__error {
  color: rgb(var(--v-theme-error));
  line-height: 1.3;
}

.tray__status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  min-width: 48px;
}

.tray__percent {
  font-size: 0.5625rem;
  color: rgb(var(--v-theme-stone));
}

.tile {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background-color: rgb(var(--v-theme-ivory-deep));
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.2s ease;
}

.tile:focus-visible,
.tile--selected {
  outline-color: rgb(var(--v-theme-blush));
}

.tile,
.tile * {
  /* Press-and-hold drags; don't select text or pop the iOS image menu */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
}

/* Held long enough to pick up */
.tile-col--chosen .tile {
  cursor: grabbing;
  outline-color: rgb(var(--v-theme-blush));
}

/* The gap where the photo will land */
.tile-col--ghost .tile {
  opacity: 0.35;
}

.tile-col--ghost .tile__caption {
  visibility: hidden;
}

/* The copy following the pointer */
.tile-col--drag {
  opacity: 1 !important;
}

.tile-col--drag .tile {
  box-shadow: 0 18px 48px -16px rgba(33, 31, 28, 0.5);
  transform: scale(1.03);
}

.tile__grip {
  align-self: center;
  opacity: 0.9;
}

.tile__pending {
  aspect-ratio: 0.8;
}

.preview {
  padding: 16px;
  background-color: rgb(var(--v-theme-ivory));
  border: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}

/* Stays in view beside the grid while dragging */
@media (min-width: 960px) {
  .preview {
    position: sticky;
    top: 24px;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
  }
}

.preview__masonry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.preview__column {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview__item {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background-color: rgb(var(--v-theme-ivory-deep));
  cursor: pointer;
  outline: 2px solid transparent;
  outline-offset: 2px;
  transition: outline-color 0.2s ease;
}

.preview__item:hover,
.preview__item:focus-visible,
.preview__item--selected {
  outline-color: rgb(var(--v-theme-blush));
}

.preview__number {
  position: absolute;
  top: 6px;
  left: 6px;
  min-width: 20px;
  padding: 1px 6px;
  font-size: 0.6875rem;
  line-height: 18px;
  text-align: center;
  color: rgb(var(--v-theme-ivory));
  background-color: rgba(var(--v-theme-charcoal), 0.8);
}

.tile__badges {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  pointer-events: none;
}

.tile__badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 2px 8px;
  font-family: var(--font-nav);
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: rgba(253, 250, 246, 0.92);
  color: rgb(var(--v-theme-charcoal));
}

.tile__badge--featured,
.tile__badge--hero {
  color: rgb(var(--v-theme-blush-dark));
}

.tile__badge--hero {
  flex-shrink: 0;
}

.tile__badge--error {
  color: rgb(var(--v-theme-error));
}

.tile__badge--muted {
  color: rgb(var(--v-theme-stone));
}

.tile__tools {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 4px;
  padding: 24px 8px 8px;
  background: linear-gradient(180deg, rgba(33, 31, 28, 0) 0%, rgba(33, 31, 28, 0.45) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tile:hover .tile__tools,
.tile:focus-within .tile__tools {
  opacity: 1;
}

@media (hover: none) {
  .tile__tools {
    opacity: 1;
  }
}

.tile__caption {
  line-height: 1.4;
}

.editor__title {
  min-width: 0;
}

.editor__filename {
  font-size: 1.375rem;
  line-height: 1.25;
}

.crop-preview {
  min-width: 0;
}

.placement-option__taken {
  color: rgb(var(--v-theme-blush-dark)) !important;
  opacity: 1 !important;
  white-space: normal !important;
  -webkit-line-clamp: unset !important;
}

.where {
  padding: 16px;
  background-color: rgb(var(--v-theme-ivory));
  border: 1px solid rgba(var(--v-theme-charcoal), 0.08);
}

.where__detail {
  min-width: 0;
}

.where__page {
  font-size: 1.0625rem;
  line-height: 1.2;
}

.where__link {
  text-decoration: none;
  white-space: nowrap;
}

.where__link:hover {
  text-decoration: underline;
}

.where__spots {
  margin: 4px 0 0;
  padding-left: 16px;
}

.where__none {
  color: rgb(var(--v-theme-blush-dark));
}

.editor__meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 16px;
  margin: 0;
}

.editor__meta dd {
  margin: 0;
}

.focus-picker {
  position: relative;
  cursor: crosshair;
}

.focus-picker__pending {
  aspect-ratio: 0.8;
  background-color: rgb(var(--v-theme-ivory-deep));
}

.focus-picker__marker {
  position: absolute;
  width: 18px;
  height: 18px;
  margin: -9px 0 0 -9px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
</style>
