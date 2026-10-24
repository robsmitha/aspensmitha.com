<route lang="yaml">
meta:
  layout: admin
</route>

<template>
  <v-container class="py-10 py-md-14">
    <router-link to="/admin/stories" class="font-nav tracking-wide text-caption text-sage back-link d-inline-flex align-center ga-2 mb-4">
      <v-icon size="14">mdi-arrow-left</v-icon>
      All Stories
    </router-link>

    <div v-if="loadError" class="py-16 text-center">
      <p class="font-display text-charcoal not-found mb-2">Story not found</p>
      <p class="text-body-2 text-charcoal-light">It may have been deleted.</p>
    </div>

    <div v-else-if="!saved || !draft" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="stone"></v-progress-circular>
    </div>

    <template v-else>
      <AdminPageHeader
        :eyebrow="`Stories · ${categoryName(saved.category)}`"
        :title="saved.title"
        :subtitle="statusLine"
      >
        <template #actions>
          <v-btn
            variant="text"
            color="sage"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            prepend-icon="mdi-open-in-new"
            :href="previewHref"
            target="_blank"
          >
            {{ saved.status === 'Draft' ? 'Preview' : 'View' }}
          </v-btn>
        </template>
      </AdminPageHeader>

      <!-- Status -->
      <section class="status-bar d-flex flex-wrap align-center ga-4 pa-4 mb-8" aria-label="Status">
        <v-btn-toggle
          :model-value="saved.status"
          mandatory
          divided
          variant="outlined"
          color="sage"
          rounded="0"
          density="comfortable"
          @update:model-value="setStatus"
        >
          <v-btn v-for="s in STATUSES" :key="s.value" :value="s.value" :loading="statusBusy === s.value" class="font-nav tracking-wide text-caption">
            {{ s.label }}
          </v-btn>
        </v-btn-toggle>
        <span class="text-body-2 text-charcoal-light status-bar__hint">{{ STATUSES.find(s => s.value === saved!.status)!.hint }}</span>
      </section>

      <v-row>
        <!-- Details -->
        <v-col cols="12" md="6" lg="5">
          <v-form class="details" @submit.prevent="save()">
            <span class="font-nav tracking-widest text-caption text-blush-dark d-block mb-4">Story details</span>

            <v-text-field
              id="story-title"
              v-model="draft.title"
              label="Title"
              placeholder="Emily & James"
              persistent-placeholder
              hint="Required. Names joined with &quot;&amp;&quot; get the italic ampersand."
              persistent-hint
              variant="outlined"
              rounded="0"
              :counter="160"
              :error-messages="fieldErrors.Title"
              class="mb-3"
            ></v-text-field>

            <v-select
              id="story-category"
              v-model="draft.category"
              :items="categoryItems"
              label="Category"
              variant="outlined"
              rounded="0"
              hide-details
              class="mb-6"
            ></v-select>

            <v-textarea
              id="story-description"
              v-model="draft.description"
              label="Description (optional)"
              hint="A few sentences introducing the couple or event. Leave blank to hide it."
              persistent-hint
              variant="outlined"
              rounded="0"
              rows="4"
              auto-grow
              :counter="2000"
              :error-messages="fieldErrors.Description"
              class="mb-3"
            ></v-textarea>

            <div class="field-row">
              <v-text-field
                id="story-date"
                v-model="draft.eventDate"
                label="Date (optional)"
                type="date"
                variant="outlined"
                rounded="0"
                clearable
                hide-details="auto"
                :error-messages="fieldErrors.EventDate"
              ></v-text-field>
              <v-text-field
                id="story-venue"
                v-model="draft.venueName"
                label="Venue (optional)"
                placeholder="Goodwood Museum"
                variant="outlined"
                rounded="0"
                :counter="160"
                hide-details="auto"
                :error-messages="fieldErrors.VenueName"
              ></v-text-field>
            </div>
            <div class="field-row mt-4">
              <v-text-field
                id="story-city"
                v-model="draft.city"
                label="City (optional)"
                placeholder="Tallahassee"
                variant="outlined"
                rounded="0"
                hide-details="auto"
                :error-messages="fieldErrors.City"
              ></v-text-field>
              <v-text-field
                id="story-state"
                v-model="draft.state"
                label="State (optional)"
                placeholder="FL"
                variant="outlined"
                rounded="0"
                hide-details="auto"
                :error-messages="fieldErrors.State"
              ></v-text-field>
            </div>

            <v-text-field
              id="story-slug"
              :model-value="draft.slug"
              label="Page address"
              :prefix="`/portfolio/${draft.category}/`"
              variant="outlined"
              rounded="0"
              :hint="slugHint"
              persistent-hint
              :error-messages="fieldErrors.Slug"
              class="mt-6 mb-3"
              @update:model-value="onSlugInput"
            ></v-text-field>

            <v-expansion-panels variant="accordion" flat class="seo mb-6">
              <v-expansion-panel>
                <v-expansion-panel-title class="font-nav tracking-wide text-caption px-4">
                  Search &amp; sharing (optional)
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p class="text-caption text-charcoal-light mb-4">
                    Leave these blank to use the defaults shown, built from the title, venue and city.
                  </p>
                  <v-text-field
                    id="story-seo-title"
                    v-model="draft.seoTitle"
                    label="Search title"
                    :placeholder="defaultSeo.title"
                    persistent-placeholder
                    variant="outlined"
                    rounded="0"
                    :counter="70"
                    :error-messages="fieldErrors.SeoTitle"
                    class="mb-3"
                  ></v-text-field>
                  <v-textarea
                    id="story-seo-description"
                    v-model="draft.seoDescription"
                    label="Search description"
                    :placeholder="defaultSeo.description"
                    persistent-placeholder
                    variant="outlined"
                    rounded="0"
                    rows="3"
                    auto-grow
                    :counter="160"
                    :error-messages="fieldErrors.SeoDescription"
                  ></v-textarea>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="d-flex align-center ga-3">
              <v-btn
                type="submit"
                variant="flat"
                color="sage"
                rounded="0"
                size="large"
                class="font-nav tracking-wide text-caption"
                :disabled="!dirty"
                :loading="saving"
              >
                Save Changes
              </v-btn>
              <v-btn
                v-if="dirty"
                variant="text"
                color="sage"
                rounded="0"
                size="large"
                class="font-nav tracking-wide text-caption"
                @click="discard"
              >
                Discard
              </v-btn>
              <span v-if="!dirty && justSaved" class="text-body-2 text-success d-inline-flex align-center ga-1" role="status">
                <v-icon size="16">mdi-check</v-icon> Saved
              </span>
            </div>
          </v-form>
        </v-col>

        <!-- Live preview of the real hero -->
        <v-col cols="12" md="6" lg="7">
          <div class="preview">
            <span class="font-nav tracking-widest text-caption text-blush-dark d-block mb-2">Live preview</span>
            <div class="preview__frame">
              <StoryHero
                :story="draft"
                :photo="heroPhoto"
                :eyebrow="copyFor(draft.category)?.eyebrow ?? 'A Story'"
                preview
              />
            </div>
            <p v-if="!heroPhoto" class="text-caption text-charcoal-light mt-2 mb-0">
              Add photos below. The first one is the hero until you pick another with the star.
            </p>
          </div>
        </v-col>
      </v-row>

      <!-- Photos -->
      <section class="mt-12" aria-labelledby="photos-heading">
        <div class="d-flex flex-wrap align-end justify-space-between ga-2 mb-4">
          <div>
            <h2 id="photos-heading" class="font-heading text-charcoal photos-heading">Photos</h2>
            <p class="text-caption text-charcoal-light mb-0">
              {{ photos.length }} photo{{ photos.length === 1 ? '' : 's' }}, shown on the page in this order, uncropped.
              <template v-if="defaultAltCount">{{ defaultAltCount }} still use the default alt text.</template>
            </p>
          </div>
        </div>
        <v-alert
          v-if="photos.length > CURATED_MAX"
          type="info"
          variant="tonal"
          color="blush-dark"
          density="compact"
          rounded="0"
          class="mb-4 text-body-2"
        >
          Most story pages show 40&ndash;120 favorites rather than the full gallery. Long stories load slower and lose readers.
        </v-alert>

        <PhotoManager
          :photos="photos"
          :all-photos="allPhotos"
          :upload-target="{ storyId: saved.id }"
          :label="saved.title"
          :refresh="reload"
          previewable
          :story="{ title: saved.title, heroPhotoId: saved.heroPhotoId, href: previewHref }"
          @replace="replacePhoto"
          @remove="removePhoto"
          @set-hero="setHero"
        />
      </section>

      <!-- Delete -->
      <section class="danger mt-16 pa-5" aria-label="Delete story">
        <h2 class="font-heading text-charcoal danger__heading mb-1">Delete this story</h2>
        <p class="text-body-2 text-charcoal-light mb-4">
          Removes the page and all {{ photos.length }} of its photos. This can&rsquo;t be undone.
        </p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-if="!confirmingDelete"
            variant="outlined"
            color="error"
            rounded="0"
            class="font-nav tracking-wide text-caption"
            @click="confirmingDelete = true"
          >
            Delete Story
          </v-btn>
          <template v-else>
            <v-btn
              variant="flat"
              color="error"
              rounded="0"
              class="font-nav tracking-wide text-caption"
              :loading="deleting"
              @click="remove"
            >
              Delete Story and {{ photos.length }} Photo{{ photos.length === 1 ? '' : 's' }}
            </v-btn>
            <v-btn variant="text" color="sage" rounded="0" class="font-nav tracking-wide text-caption" @click="confirmingDelete = false">
              Keep It
            </v-btn>
          </template>
        </div>
      </section>
    </template>

    <v-snackbar v-model="snackbar" color="error" timeout="8000">{{ errorMessage }}</v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import apiClient from '@/api/elysianClient'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'
import PhotoManager from '@/components/Admin/PhotoManager.vue'
import StoryHero from '@/components/Stories/StoryHero.vue'
import { PORTFOLIO_CATEGORIES, getPortfolioCategory } from '@/utils/portfolioCategories'
import { byManagedOrder, type ManagedPhoto } from '@/utils/managedPhotos'
import { storySeo } from '@/utils/seo'
import { STORY_SLUG_PATTERN, storyPath, storySlug, type StoryStatus } from '@/utils/stories'

interface ManagedStory {
  id: string
  slug: string
  category: string
  title: string
  description: string | null
  eventDate: string | null
  venueName: string | null
  city: string | null
  state: string | null
  heroPhotoId: string | null
  status: StoryStatus
  publishedAt: string | null
  seoTitle: string | null
  seoDescription: string | null
  photos: ManagedPhoto[]
}

type Fields = Omit<ManagedStory, 'id' | 'status' | 'publishedAt' | 'photos'>

const STATUSES: { value: StoryStatus, label: string, hint: string }[] = [
  { value: 'Draft', label: 'Draft', hint: 'Only you can see it. Use Preview to check the page.' },
  { value: 'Unlisted', label: 'Unlisted', hint: 'Anyone with the link can open it. It isn’t listed or shown in search.' },
  { value: 'Published', label: 'Published', hint: 'Listed in its category and shown in search.' },
]
/** Past this many photos the editor suggests trimming */
const CURATED_MAX = 150

const categoryItems = PORTFOLIO_CATEGORIES.filter(c => c.stories).map(c => ({ title: c.name, value: c.slug }))

const route = useRoute()
const router = useRouter()
const storyId = computed(() => String((route.params as Record<string, string>).id))

const saved = ref<ManagedStory>()
const draft = ref<Fields>()
const photos = ref<ManagedPhoto[]>([])
const allPhotos = ref<ManagedPhoto[]>([])
const loadError = ref(false)
const saving = ref(false)
const justSaved = ref(false)
const statusBusy = ref<StoryStatus | null>(null)
const confirmingDelete = ref(false)
const deleting = ref(false)
const snackbar = ref(false)
const errorMessage = ref('')
const fieldErrors = reactive<Record<string, string[]>>({})
/** The address follows the title and venue until it's edited by hand or the story has been published */
const slugFollowsTitle = ref(false)

function fieldsOf(story: ManagedStory): Fields {
  return {
    slug: story.slug,
    category: story.category,
    title: story.title,
    description: story.description,
    eventDate: story.eventDate,
    venueName: story.venueName,
    city: story.city,
    state: story.state,
    heroPhotoId: story.heroPhotoId,
    seoTitle: story.seoTitle,
    seoDescription: story.seoDescription,
  }
}

/** Blank and null are the same to the server */
function normalize(fields: Fields) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v ?? null]))
}

const dirty = computed(() => !!saved.value && !!draft.value &&
  JSON.stringify(normalize(draft.value)) !== JSON.stringify(normalize(fieldsOf(saved.value))))

const heroPhoto = computed(() => {
  const ready = photos.value.filter(p => p.status === 'Ready' && p.srcBase)
  const photo = ready.find(p => p.id === draft.value?.heroPhotoId) ?? ready[0]
  return photo ? { ...photo, srcBase: photo.srcBase!, width: photo.width ?? 0, height: photo.height ?? 0 } : null
})

const defaultAltCount = computed(() => photos.value.filter(p => !p.altText?.trim()).length)

const previewHref = computed(() => {
  if (!saved.value) return undefined
  const path = storyPath(saved.value)
  return saved.value.status === 'Draft' ? `${path}?preview=${saved.value.id}` : path
})

const statusLine = computed(() => {
  if (!saved.value) return undefined
  const s = saved.value
  if (s.status === 'Draft') return s.publishedAt ? 'Draft · Unpublished' : 'Draft · Not published yet'
  return s.publishedAt ? `${s.status} · First published ${new Date(s.publishedAt).toLocaleDateString()}` : s.status
})

const slugHint = computed(() => {
  if (!saved.value || !draft.value) return ''
  if (saved.value.publishedAt && draft.value.slug !== saved.value.slug) {
    return 'This story has been published. Changing its address breaks links people already have.'
  }
  return slugFollowsTitle.value ? 'Follows the title and venue until you edit it.' : 'Lowercase letters, numbers and hyphens.'
})

const defaultSeo = computed(() => {
  const d = draft.value!
  return storySeo({ ...d, seoTitle: null, seoDescription: null, status: 'Published' }, '')
})

function copyFor(category: string) {
  return getPortfolioCategory(category)?.stories
}

function categoryName(slug: string) {
  return getPortfolioCategory(slug)?.name ?? slug
}

function showError(message: string | undefined) {
  errorMessage.value = message || 'An error occurred. Please try again later.'
  snackbar.value = true
}

function setFieldErrors(errors: Map<string, string[]> | undefined) {
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  errors?.forEach((messages, key) => { fieldErrors[key] = messages })
}

// Keep the address in step with the title and venue while it's following them
watch(() => [draft.value?.title, draft.value?.venueName], () => {
  if (draft.value && slugFollowsTitle.value) {
    draft.value.slug = storySlug(draft.value.title, draft.value.venueName)
  }
})

function onSlugInput(value: string) {
  if (!draft.value) return
  draft.value.slug = value.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  slugFollowsTitle.value = false
  fieldErrors.Slug = []
}

function applyStory(story: ManagedStory, { keepDraft = false } = {}) {
  saved.value = story
  photos.value = [...story.photos].sort(byManagedOrder)
  if (!keepDraft || !draft.value) {
    draft.value = fieldsOf(story)
    slugFollowsTitle.value = !story.publishedAt &&
      (story.slug === storySlug(story.title, story.venueName) || story.slug === storySlug(story.title))
  } else {
    // The server clears the hero when that photo is deleted
    draft.value.heroPhotoId = draft.value.heroPhotoId && story.photos.some(p => p.id === draft.value!.heroPhotoId)
      ? draft.value.heroPhotoId
      : story.heroPhotoId
  }
}

async function load() {
  const response = await apiClient.getData(`/api/manage/stories/${encodeURIComponent(storyId.value)}`)
  if (!response.success) {
    if (response.statusCode === 404 || response.statusCode === 400) loadError.value = true
    else showError(response.errorMessage)
    return
  }
  applyStory(response.data)
}

/** Reload after photo changes, keeping unsaved field edits */
async function reload() {
  const [storyResponse, photosResponse] = await Promise.all([
    apiClient.getData(`/api/manage/stories/${encodeURIComponent(storyId.value)}`),
    apiClient.getData('/api/manage/photos'),
  ])
  if (storyResponse.success) applyStory(storyResponse.data, { keepDraft: true })
  if (photosResponse.success) allPhotos.value = photosResponse.data
}

async function loadAllPhotos() {
  const response = await apiClient.getData('/api/manage/photos')
  if (response.success) allPhotos.value = response.data
}

async function save(fields: Fields = draft.value!): Promise<boolean> {
  if (!saved.value) return false
  if (!STORY_SLUG_PATTERN.test(fields.slug)) {
    fieldErrors.Slug = ['Use lowercase letters, numbers and single hyphens, like "emily-and-james".']
    return false
  }
  saving.value = true
  const response = await apiClient.postData('/api/manage/stories/update', {
    storyId: saved.value.id,
    ...normalize(fields),
    title: fields.title,
  })
  saving.value = false
  if (!response.success) {
    setFieldErrors(response.errors)
    const shown = ['Title', 'Description', 'EventDate', 'VenueName', 'City', 'State', 'Slug', 'SeoTitle', 'SeoDescription']
    if (!response.errors || [...response.errors.keys()].some(k => !shown.includes(k))) showError(response.errorMessage)
    return false
  }
  setFieldErrors(undefined)
  const wasFollowing = slugFollowsTitle.value
  applyStory({ ...response.data, photos: photos.value } as ManagedStory)
  slugFollowsTitle.value = wasFollowing && !response.data.publishedAt
  justSaved.value = true
  return true
}

function discard() {
  if (!saved.value) return
  applyStory(saved.value)
  setFieldErrors(undefined)
}

/** Choosing a hero saves right away, without the other unsaved edits */
async function setHero(photoId: string) {
  if (!saved.value || !draft.value) return
  const ok = await save({ ...fieldsOf(saved.value), heroPhotoId: photoId })
  if (ok && draft.value) draft.value.heroPhotoId = photoId
}

async function setStatus(status: StoryStatus) {
  if (!saved.value || status === saved.value.status) return
  // Publishing shows what's in the form, so save it first
  if (dirty.value && !(await save())) return
  statusBusy.value = status
  const response = await apiClient.postData('/api/manage/stories/status', { storyId: saved.value.id, status })
  statusBusy.value = null
  if (!response.success) {
    showError(response.errorMessage)
    return
  }
  saved.value = { ...saved.value, status: response.data.status, publishedAt: response.data.publishedAt }
  if (response.data.publishedAt) slugFollowsTitle.value = false
}

function replacePhoto(updated: ManagedPhoto) {
  photos.value = photos.value.map(p => (p.id === updated.id ? updated : p))
  allPhotos.value = allPhotos.value.map(p => (p.id === updated.id ? updated : p))
}

function removePhoto(photoId: string) {
  photos.value = photos.value.filter(p => p.id !== photoId)
  if (saved.value?.heroPhotoId === photoId) saved.value = { ...saved.value, heroPhotoId: null }
  if (draft.value?.heroPhotoId === photoId) draft.value.heroPhotoId = null
}

async function remove() {
  if (!saved.value) return
  deleting.value = true
  const response = await apiClient.postData('/api/manage/stories/delete', { storyId: saved.value.id })
  deleting.value = false
  if (!response.success) {
    showError(response.errorMessage)
    return
  }
  saved.value = undefined
  draft.value = undefined
  router.push('/admin/stories')
}

watch(dirty, d => { if (d) justSaved.value = false })

// Unsaved edits: ask before leaving
onBeforeRouteLeave(() => !dirty.value || window.confirm('You have unsaved changes to this story. Leave without saving?'))
function onBeforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault()
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  load()
  loadAllPhotos()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<style scoped>
.back-link {
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.not-found {
  font-size: 1.75rem;
}

.status-bar {
  background-color: rgb(var(--v-theme-ivory-deep));
}

.status-bar__hint {
  flex: 1 1 240px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 16px;
}

.seo {
  border: 1px solid rgba(var(--v-theme-charcoal), 0.15);
}

.preview {
  position: sticky;
  top: 96px;
}

.preview__frame {
  border: 1px solid rgba(var(--v-theme-charcoal), 0.12);
  background-color: rgb(var(--v-theme-background));
  padding: 0 4px;
}

.photos-heading {
  font-size: clamp(1.75rem, 1vw + 1.25rem, 2.25rem);
  line-height: 1.15;
}

.danger {
  border: 1px solid rgba(var(--v-theme-error), 0.3);
}

.danger__heading {
  font-size: 1.375rem;
}
</style>
