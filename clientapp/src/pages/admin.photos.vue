<route lang="yaml">
meta:
  layout: admin
</route>

<template>
  <v-container class="py-10 py-md-14">
    <AdminPageHeader
      eyebrow="Media Library"
      title="Photos"
      :subtitle="`${photos.length} photo${photos.length === 1 ? '' : 's'}`"
    >
      <template #actions>
        <v-btn
          variant="text"
          color="charcoal"
          rounded="0"
          class="font-nav tracking-wide text-caption"
          prepend-icon="mdi-refresh"
          :loading="refreshing"
          @click="refresh"
        >
          Refresh
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-row>
      <!-- Collections: sidebar on desktop, dropdown on phones -->
      <v-col cols="12" md="3" lg="2" class="pr-md-6">
        <v-select
          v-model="tab"
          :items="collectionSelectItems"
          label="Collection"
          variant="outlined"
          rounded="0"
          hide-details
          class="d-md-none"
        ></v-select>

        <nav class="collections d-none d-md-block" aria-label="Photo collections">
          <template v-for="group in collectionGroups" :key="group.label">
            <span class="font-nav tracking-widest text-caption text-stone text-uppercase collections__label">{{ group.label }}</span>
            <button
              v-for="c in group.items"
              :key="c.slug"
              type="button"
              class="collections__item"
              :class="{ 'collections__item--active': tab === c.slug }"
              :aria-current="tab === c.slug ? 'page' : undefined"
              @click="tab = c.slug"
            >
              <span class="font-nav tracking-wide text-caption text-uppercase">{{ c.name }}</span>
              <span class="d-flex align-center ga-2">
                <span
                  v-if="needsAttention(c.slug)"
                  class="collections__alert"
                  title="Has photos that failed or are still waiting to process"
                ></span>
                <span class="text-caption text-stone">{{ photosIn(c.slug).length }}</span>
              </span>
            </button>
          </template>
        </nav>
      </v-col>

      <v-col cols="12" md="9" lg="10">
        <div class="mb-6">
          <h2 class="font-display text-charcoal collection-title">{{ currentCollection.name }}</h2>
          <p class="font-display text-stone collection-description mb-0">{{ currentCollection.description }}</p>
        </div>

        <!-- Upload straight into the collection being viewed -->
        <div
          class="drop-zone d-flex flex-column align-center justify-center text-center pa-6 mb-4"
          :class="{ 'drop-zone--active': dragging }"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <v-icon size="28" color="stone">mdi-image-plus-outline</v-icon>
          <span class="font-display text-charcoal mt-2">Add photos to {{ currentCollection.name }}</span>
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

        <p v-if="!photosIn(tab).length" class="font-display text-stone empty-state py-8 text-center">
          No photos in {{ currentCollection.name }} yet.
        </p>

        <v-row dense>
          <v-col v-for="(photo, index) in photosIn(tab)" :key="photo.id" cols="6" sm="4" lg="3">
            <div
              class="tile"
              :class="{ 'tile--selected': editingId === photo.id }"
              role="button"
              tabindex="0"
              :aria-label="`Edit ${photo.originalFileName}`"
              @click="openEditor(photo)"
              @keydown.enter="openEditor(photo)"
            >
              <v-img
                v-if="photo.srcBase"
                :src="`${photo.srcBase}/${pickWidth(photo)}.webp`"
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
                <v-spacer></v-spacer>
                <span
                  v-if="photo.placements.length"
                  class="tile__badge tile__badge--featured"
                  :title="photo.placements.map(placementTitle).join('\n')"
                >
                  <v-icon size="11" class="mr-1">mdi-star</v-icon>{{ placementBadge(photo) }}
                </span>
              </div>

              <!-- Hover tools (always visible on touch screens) -->
              <div class="tile__tools" @click.stop>
                <v-btn
                  icon="mdi-chevron-left"
                  size="x-small"
                  variant="flat"
                  color="ivory"
                  rounded="0"
                  :disabled="index === 0"
                  aria-label="Move earlier"
                  @click="move(photo, -1)"
                ></v-btn>
                <v-btn
                  icon="mdi-chevron-right"
                  size="x-small"
                  variant="flat"
                  color="ivory"
                  rounded="0"
                  :disabled="index === photosIn(tab).length - 1"
                  aria-label="Move later"
                  @click="move(photo, 1)"
                ></v-btn>
                <v-spacer></v-spacer>
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
              <span v-if="photo.altText" class="text-charcoal">{{ photo.altText }}</span>
              <span v-else class="text-stone">{{ photo.originalFileName }}</span>
            </p>
          </v-col>
        </v-row>
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
              :src="`${editing.srcBase}/${pickWidth(editing, 800)}.webp`"
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
                  :src="`${editing.srcBase}/${pickWidth(editing, 400)}.webp`"
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

          <v-textarea
            v-model="editingDraft!.altText"
            label="Alt text"
            hint="Describe the photo for screen readers and search engines"
            persistent-hint
            variant="outlined"
            rounded="0"
            rows="2"
            auto-grow
            class="mb-4"
          ></v-textarea>
          <v-select
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

          <!-- Where this photo appears on the public site; updates live as the fields change -->
          <section class="where mb-6" aria-label="Where this photo appears">
            <span class="font-nav tracking-widest text-caption text-stone text-uppercase d-block mb-3">
              Where this photo appears
            </span>

            <div v-for="group in placementsByPage(editingDraft!.placements)" :key="group.page" class="d-flex ga-3 mb-3">
              <PlacementMap :page="group.page" :highlight="group.placements.map(p => p.area)" />
              <div class="where__detail">
                <div class="d-flex align-center ga-2">
                  <span class="font-display text-charcoal where__page">{{ group.name }} page</span>
                  <a :href="group.path" target="_blank" class="font-nav text-caption text-blush where__link">View &#8599;</a>
                </div>
                <ul class="where__spots text-caption text-stone">
                  <li v-for="placement in group.placements" :key="placement.key">{{ placement.label }}</li>
                </ul>
              </div>
            </div>

            <div v-if="galleryFor(editingDraft!.category)" class="d-flex align-center ga-2 text-caption">
              <v-icon size="16" color="stone">mdi-view-grid-outline</v-icon>
              <span class="text-charcoal">Portfolio &rsaquo; {{ galleryFor(editingDraft!.category)!.name }} gallery</span>
              <a :href="`/portfolio/${editingDraft!.category}`" target="_blank" class="font-nav text-blush where__link">View &#8599;</a>
            </div>

            <p
              v-if="!editingDraft!.placements.length && !galleryFor(editingDraft!.category)"
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
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { BlockBlobClient } from '@azure/storage-blob'
import apiClient from '@/api/elysianClient'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'
import { PORTFOLIO_CATEGORIES, SITE_ONLY_CATEGORY } from '@/utils/portfolioCategories'
import { SITE_PAGES, SITE_PLACEMENTS, placementTitle, placementsByPage } from '@/utils/sitePlacements'
import PlacementMap from '@/components/Admin/PlacementMap.vue'

interface ManagedPhoto {
  id: string
  category: string
  /** Site spots this photo fills (see sitePlacements.ts) */
  placements: string[]
  sortOrder: number
  altText: string | null
  width: number | null
  height: number | null
  focusX: number
  focusY: number
  placeholder: string | null
  srcBase: string | null
  widths: number[]
  status: 'Uploaded' | 'Processing' | 'Ready' | 'Failed'
  processingError: string | null
  originalFileName: string
  originalFileSize: number
  createdAt: string
}

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

interface Collection {
  slug: string
  name: string
  description: string
}

const collectionGroups: { label: string, items: Collection[] }[] = [
  {
    label: 'Portfolio',
    items: PORTFOLIO_CATEGORIES.map(c => ({ slug: c.slug, name: c.name, description: c.description })),
  },
  {
    label: 'Site',
    items: [{
      slug: SITE_ONLY_CATEGORY.slug,
      name: 'Site only',
      description: 'Photos used only in featured placements, like your own portrait. Never shown in a gallery.',
    }],
  },
]
const collections = collectionGroups.flatMap(g => g.items)
const placementItems = SITE_PLACEMENTS.map(p => ({
  title: p.label,
  value: p.key,
  page: p.page,
  pageName: SITE_PAGES[p.page].name,
}))

/** How the chosen focal point plays out in the site's common crops */
const CROP_PREVIEWS = [
  { label: 'Portrait', ratio: 0.8, flex: '0.8' },
  { label: 'Landscape', ratio: 1.3333, flex: '1.3333' },
  { label: 'Banner', ratio: 2, flex: '2' },
]

const { xs, width: displayWidth } = useDisplay()

const photos = ref<ManagedPhoto[]>([])
const drafts = reactive<Record<string, Draft>>({})
const busy = reactive<Record<string, string | undefined>>({})
const uploads = ref<Upload[]>([])
const trayCollapsed = ref(false)
/** A clean batch leaves the tray up this long before it clears itself */
const TRAY_DISMISS_MS = 4000
let trayTimer: ReturnType<typeof setTimeout> | undefined

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
const tab = ref<string>(PORTFOLIO_CATEGORIES[0].slug)
const dragging = ref(false)
const refreshing = ref(false)
const confirmingDelete = ref<string | null>(null)
const fileInput = ref<HTMLInputElement>()
const snackbar = ref(false)
const errorMessage = ref('')
const now = ref(Date.now())
let pollTimer: ReturnType<typeof setTimeout> | undefined

const currentCollection = computed(() => collections.find(c => c.slug === tab.value) ?? collections[0])

const collectionSelectItems = computed(() =>
  collections.map(c => ({ title: `${c.name} (${photosIn(c.slug).length})`, value: c.slug })))

const shouldPoll = computed(() => photos.value.some(p => isPending(p) && pendingFor(p) < STOP_POLLING_AFTER_MS))

function photosIn(category: string) {
  return photos.value
    .filter(p => p.category === category)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
}

function isPending(photo: ManagedPhoto) {
  return photo.status === 'Uploaded' || photo.status === 'Processing'
}

function pendingFor(photo: ManagedPhoto) {
  return now.value - Date.parse(photo.createdAt)
}

function isStuck(photo: ManagedPhoto) {
  return isPending(photo) && !busy[photo.id] && pendingFor(photo) > STUCK_AFTER_MS
}

function needsAttention(category: string) {
  return photosIn(category).some(p => p.status === 'Failed' || isStuck(p))
}

function statusColor(status: ManagedPhoto['status']) {
  return { Uploaded: 'stone', Processing: 'blush', Ready: 'success', Failed: 'error' }[status]
}

function pickWidth(photo: ManagedPhoto, min = 400) {
  return photo.widths.find(w => w >= min) ?? photo.widths[photo.widths.length - 1]
}

/** One spot: "Home › Intro portrait…"; several: "3 spots" */
function placementBadge(photo: ManagedPhoto) {
  return photo.placements.length === 1 ? placementTitle(photo.placements[0]) : `${photo.placements.length} spots`
}

/** The photo currently filling a spot, if any */
function placementHolder(key: string) {
  return photos.value.find(p => p.placements.includes(key))
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
const editing = computed(() => photos.value.find(p => p.id === editingId.value))
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

function isDirty(photo: ManagedPhoto) {
  const d = drafts[photo.id]
  return !!d && (
    (d.altText ?? '') !== (photo.altText ?? '') ||
    !sameSet(d.placements, photo.placements) ||
    d.category !== photo.category ||
    d.focusX !== photo.focusX ||
    d.focusY !== photo.focusY
  )
}

/** Replace the list, keeping any unsaved edits */
function applyPhotos(next: ManagedPhoto[]) {
  const previous = new Map(photos.value.map(p => [p.id, p]))
  for (const photo of next) {
    const old = previous.get(photo.id)
    if (!drafts[photo.id] || (old && !isDirty(old))) {
      drafts[photo.id] = toDraft(photo)
    }
  }
  photos.value = next
}

function replacePhoto(updated: ManagedPhoto) {
  photos.value = photos.value.map(p => (p.id === updated.id ? updated : p))
  drafts[updated.id] = toDraft(updated)
}

async function refresh() {
  refreshing.value = true
  const response = await apiClient.getData('/api/manage/photos')
  refreshing.value = false
  now.value = Date.now()
  if (!response.success) {
    showError(response.errorMessage)
    return
  }
  applyPhotos(response.data)
}

watch(tab, () => {
  if (!uploadsActive.value) clearUploads()
})

// Poll only while something is recently uploaded/processing; long-stuck photos show a Reprocess prompt instead
watch(shouldPoll, poll => {
  clearTimeout(pollTimer)
  if (poll) schedulePoll()
})

function schedulePoll() {
  pollTimer = setTimeout(async () => {
    await refresh()
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
  const category = tab.value

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
    const photoId = await uploadFile(file, category, upload)
    if (photoId) uploaded.push(photoId)
  }
  await refresh()

  if (PROCESS_AFTER_UPLOAD) {
    for (const photoId of uploaded) {
      const photo = photos.value.find(p => p.id === photoId)
      if (photo && isPending(photo)) await reprocess(photo)
    }
  }
}

/** Returns the new photo's id once its original is in storage */
async function uploadFile(file: File, category: string, upload: Upload): Promise<string | undefined> {
  upload.status = 'uploading'

  const response = await apiClient.postData('/api/manage/photos/upload', {
    fileName: file.name,
    fileSize: file.size,
    category,
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
  // Taking a spot from another photo, or changing collection, affects other photos: reload everything
  if (!sameSet(d.placements, photo.placements) || d.category !== photo.category) {
    await refresh()
  } else {
    replacePhoto(response.data)
  }
}

async function move(photo: ManagedPhoto, direction: -1 | 1) {
  const ordered = photosIn(photo.category)
  const from = ordered.findIndex(p => p.id === photo.id)
  const [item] = ordered.splice(from, 1)
  ordered.splice(from + direction, 0, item)
  ordered.forEach((p, i) => { p.sortOrder = i })

  const response = await apiClient.postData('/api/manage/photos/reorder', { photoIds: ordered.map(p => p.id) })
  if (!response.success) {
    showError(response.errorMessage)
    await refresh()
  }
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
  photos.value = photos.value.filter(p => p.id !== photo.id)
  if (editingId.value === photo.id) editingId.value = null
}

onMounted(refresh)
onBeforeUnmount(() => {
  clearTimeout(pollTimer)
  clearTimeout(trayTimer)
})
</script>

<style scoped>
.collections {
  position: sticky;
  top: 96px;
}

.collections__label {
  display: block;
  padding: 0 12px;
  margin: 24px 0 8px;
}

.collections__label:first-child {
  margin-top: 0;
}

.collections__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  color: rgb(var(--v-theme-charcoal));
  border-left: 2px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.collections__item:hover {
  background-color: rgb(var(--v-theme-ivory-deep));
}

.collections__item--active {
  background-color: rgb(var(--v-theme-ivory-deep));
  border-left-color: rgb(var(--v-theme-blush));
}

.collections__alert {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgb(var(--v-theme-error));
}

.collection-title {
  font-size: clamp(1.75rem, 1vw + 1.25rem, 2.25rem);
  line-height: 1.15;
}

.collection-description {
  font-size: 1.0625rem;
}

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
.drop-zone--active {
  background-color: rgb(var(--v-theme-ivory-deep));
  border-color: rgb(var(--v-theme-blush));
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

.tile__pending {
  aspect-ratio: 0.8;
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

.tile__badge--featured {
  color: rgb(var(--v-theme-blush-dark));
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
