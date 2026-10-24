<route lang="yaml">
meta:
  layout: admin
</route>

<template>
  <v-container class="py-10 py-md-14">
    <AdminPageHeader
      eyebrow="Media Library"
      title="Photos"
      :subtitle="`${libraryPhotos.length} photo${libraryPhotos.length === 1 ? '' : 's'}`"
    >
      <template #actions>
        <v-btn
          variant="text"
          color="sage"
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

    <PlacementPublishStatus ref="publishStatus" @error="showError" />

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

          <router-link to="/admin/stories" class="collections__stories font-nav tracking-wide text-caption text-sage">
            Wedding &amp; event stories &rarr;
          </router-link>
        </nav>
      </v-col>

      <v-col cols="12" md="9" lg="10">
        <div class="mb-6">
          <h2 class="font-heading text-charcoal collection-title">{{ currentCollection.name }}</h2>
          <p class="font-display text-stone collection-description mb-0">{{ currentCollection.description }}</p>
          <p v-if="getPortfolioCategory(tab)?.stories" class="text-caption text-charcoal-light mt-2 mb-0">
            Once a {{ currentCollection.name.toLowerCase() }} story is published, the public page lists stories instead of this gallery.
            <router-link to="/admin/stories" class="text-sage">Manage stories</router-link>
          </p>
        </div>

        <PhotoManager
          :photos="photosIn(tab)"
          :all-photos="photos"
          :upload-target="{ category: tab }"
          :label="currentCollection.name"
          :refresh="refresh"
          :previewable="!!getPortfolioCategory(tab)"
          @replace="replacePhoto"
          @remove="removePhoto"
          @changed="publishStatus?.refresh()"
        />
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" color="error" timeout="8000">{{ errorMessage }}</v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '@/api/elysianClient'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'
import PhotoManager from '@/components/Admin/PhotoManager.vue'
import PlacementPublishStatus from '@/components/Admin/PlacementPublishStatus.vue'
import { PORTFOLIO_CATEGORIES, SITE_ONLY_CATEGORY, getPortfolioCategory } from '@/utils/portfolioCategories'
import { byManagedOrder, type ManagedPhoto } from '@/utils/managedPhotos'

/** Uploaded/Processing longer than this is flagged in the sidebar (matches PhotoManager) */
const STUCK_AFTER_MS = 30_000

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

/** Every photo, story photos included, so placements can say which photo fills a spot */
const photos = ref<ManagedPhoto[]>([])
/** Story photos are managed on their story */
const libraryPhotos = computed(() => photos.value.filter(p => !p.storyId))
const refreshing = ref(false)
const publishStatus = ref<InstanceType<typeof PlacementPublishStatus>>()
const snackbar = ref(false)
const errorMessage = ref('')
const tab = ref<string>(PORTFOLIO_CATEGORIES[0].slug)

const currentCollection = computed(() => collections.find(c => c.slug === tab.value) ?? collections[0])

const collectionSelectItems = computed(() =>
  collections.map(c => ({ title: `${c.name} (${photosIn(c.slug).length})`, value: c.slug })))

function photosIn(category: string) {
  return libraryPhotos.value.filter(p => p.category === category).sort(byManagedOrder)
}

function needsAttention(category: string) {
  const now = Date.now()
  return photosIn(category).some(p => p.status === 'Failed' ||
    ((p.status === 'Uploaded' || p.status === 'Processing') && now - Date.parse(p.createdAt) > STUCK_AFTER_MS))
}

async function refresh() {
  refreshing.value = true
  const response = await apiClient.getData('/api/manage/photos')
  refreshing.value = false
  if (!response.success) {
    showError(response.errorMessage || 'Could not load photos. Please try again later.')
    return
  }
  photos.value = response.data
  // Reloads also follow uploads through processing, which can change a Home/Portfolio spot
  publishStatus.value?.refresh()
}

function showError(message: string | undefined) {
  errorMessage.value = message || 'An error occurred. Please try again later.'
  snackbar.value = true
}

function replacePhoto(updated: ManagedPhoto) {
  photos.value = photos.value.map(p => (p.id === updated.id ? updated : p))
}

function removePhoto(photoId: string) {
  photos.value = photos.value.filter(p => p.id !== photoId)
}

onMounted(refresh)
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

.collections__stories {
  display: block;
  margin-top: 24px;
  padding: 10px 12px;
  text-decoration: none;
}

.collections__stories:hover {
  text-decoration: underline;
}

.collection-title {
  font-size: clamp(1.75rem, 1vw + 1.25rem, 2.25rem);
  line-height: 1.15;
}

.collection-description {
  font-size: 1.0625rem;
}
</style>
