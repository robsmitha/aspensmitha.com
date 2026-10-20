<route lang="yaml">
meta:
  layout: admin
</route>

<template>
  <v-container class="py-10 py-md-14">
    <AdminPageHeader
      eyebrow="Portfolio"
      title="Stories"
      :subtitle="loaded ? `${stories.length} stor${stories.length === 1 ? 'y' : 'ies'}` : undefined"
    >
      <template #actions>
        <v-btn
          variant="flat"
          color="charcoal"
          rounded="0"
          class="font-nav tracking-wide text-caption"
          prepend-icon="mdi-plus"
          @click="creating = !creating"
        >
          New Story
        </v-btn>
      </template>
    </AdminPageHeader>

    <!-- New story: just a category and a title; everything else is on the story's page -->
    <v-expand-transition>
      <v-form v-if="creating" class="new-story pa-5 mb-8" @submit.prevent="create">
        <h2 class="font-display text-charcoal new-story__heading mb-4">New story</h2>
        <div class="d-flex flex-wrap ga-4 align-start">
          <v-select
            id="new-story-category"
            v-model="newCategory"
            :items="categoryItems"
            label="Category"
            variant="outlined"
            rounded="0"
            hide-details
            class="new-story__category"
          ></v-select>
          <v-text-field
            id="new-story-title"
            v-model="newTitle"
            label="Title"
            placeholder="Emily & James"
            persistent-placeholder
            variant="outlined"
            rounded="0"
            autofocus
            :error-messages="createError"
            class="new-story__title"
            @update:model-value="createError = ''"
          ></v-text-field>
          <div class="d-flex ga-2 new-story__actions">
            <v-btn
              type="submit"
              variant="flat"
              color="charcoal"
              rounded="0"
              size="large"
              class="font-nav tracking-wide text-caption"
              :loading="saving"
              :disabled="!newTitle.trim()"
            >
              Create Draft
            </v-btn>
            <v-btn variant="text" color="charcoal" rounded="0" size="large" class="font-nav tracking-wide text-caption" @click="creating = false">
              Cancel
            </v-btn>
          </div>
        </div>
      </v-form>
    </v-expand-transition>

    <div class="d-flex flex-wrap ga-2 mb-6" role="group" aria-label="Filter by category">
      <v-chip
        v-for="f in filters"
        :key="f.value"
        :variant="filter === f.value ? 'flat' : 'outlined'"
        :color="filter === f.value ? 'charcoal' : 'stone'"
        label
        class="font-nav tracking-wide text-caption"
        @click="filter = f.value"
      >
        {{ f.title }} &middot; {{ f.count }}
      </v-chip>
    </div>

    <div v-if="!loaded" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="stone"></v-progress-circular>
    </div>

    <div v-else-if="!shown.length" class="empty py-16 text-center">
      <p class="font-display text-charcoal empty__heading mb-2">No stories yet</p>
      <p class="text-body-2 text-charcoal-light mb-6">
        A story is one wedding or event told as its own page: a hero with the couple&rsquo;s names and details, then the photos in order.
      </p>
      <v-btn variant="outlined" color="charcoal" rounded="0" class="font-nav tracking-wide text-caption" @click="creating = true">
        Start Your First Story
      </v-btn>
    </div>

    <ul v-else class="story-rows">
      <li v-for="story in shown" :key="story.id">
        <router-link :to="`/admin/stories/${story.id}`" class="story-row text-decoration-none">
          <div class="story-row__thumb">
            <v-img
              v-if="story.cover?.srcBase"
              :src="`${story.cover.srcBase}/${managedPhotoWidth(story.cover, 200)}.webp`"
              :lazy-src="story.cover.placeholder ?? undefined"
              aspect-ratio="0.8"
              cover
              :position="`${story.cover.focusX * 100}% ${story.cover.focusY * 100}%`"
            ></v-img>
            <div v-else class="story-row__empty d-flex align-center justify-center">
              <v-icon color="stone" size="22">mdi-image-outline</v-icon>
            </div>
          </div>

          <div class="story-row__main">
            <span class="font-display text-charcoal story-row__title">{{ story.title }}</span>
            <span class="text-caption text-charcoal-light">
              {{ [categoryName(story.category), formatStoryDate(story.eventDate, 'short'), story.venueName].filter(Boolean).join(' · ') }}
            </span>
          </div>

          <div class="story-row__side">
            <v-chip :color="STATUS_COLORS[story.status]" size="small" label variant="tonal" class="font-nav">
              {{ story.status }}
            </v-chip>
            <span class="text-caption text-stone">
              {{ story.photoCount }} photo{{ story.photoCount === 1 ? '' : 's' }}
            </span>
          </div>
          <v-icon color="stone" size="18" class="story-row__chevron">mdi-chevron-right</v-icon>
        </router-link>
      </li>
    </ul>

    <v-snackbar v-model="snackbar" color="error" timeout="8000">{{ errorMessage }}</v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/elysianClient'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'
import { PORTFOLIO_CATEGORIES, getPortfolioCategory } from '@/utils/portfolioCategories'
import { managedPhotoWidth, type ManagedPhoto } from '@/utils/managedPhotos'
import { formatStoryDate, type StoryStatus } from '@/utils/stories'

interface ManagedStorySummary {
  id: string
  slug: string
  category: string
  title: string
  eventDate: string | null
  venueName: string | null
  city: string | null
  state: string | null
  status: StoryStatus
  publishedAt: string | null
  modifiedAt: string
  cover: ManagedPhoto | null
  photoCount: number
}

const STATUS_COLORS: Record<StoryStatus, string> = { Draft: 'stone', Unlisted: 'blush-dark', Published: 'success' }

const storyCategories = PORTFOLIO_CATEGORIES.filter(c => c.stories)
const categoryItems = storyCategories.map(c => ({ title: c.name, value: c.slug }))

const router = useRouter()
const stories = ref<ManagedStorySummary[]>([])
const loaded = ref(false)
const filter = ref<string>('all')
const snackbar = ref(false)
const errorMessage = ref('')

const creating = ref(false)
const newCategory = ref(storyCategories[0]?.slug ?? 'weddings')
const newTitle = ref('')
const createError = ref('')
const saving = ref(false)

const filters = computed(() => [
  { title: 'All', value: 'all', count: stories.value.length },
  ...storyCategories.map(c => ({ title: c.name, value: c.slug, count: stories.value.filter(s => s.category === c.slug).length })),
])

const shown = computed(() => (filter.value === 'all' ? stories.value : stories.value.filter(s => s.category === filter.value)))

function categoryName(slug: string) {
  return getPortfolioCategory(slug)?.name ?? slug
}

async function load() {
  const response = await apiClient.getData('/api/manage/stories')
  loaded.value = true
  if (!response.success) {
    errorMessage.value = response.errorMessage || 'Could not load stories. Please try again later.'
    snackbar.value = true
    return
  }
  stories.value = response.data
}

async function create() {
  if (!newTitle.value.trim()) return
  saving.value = true
  const response = await apiClient.postData('/api/manage/stories/create', { category: newCategory.value, title: newTitle.value })
  saving.value = false
  if (!response.success) {
    createError.value = response.errors?.get('Title')?.join(' ') ?? ''
    if (!createError.value) {
      errorMessage.value = response.errorMessage || 'Could not create the story.'
      snackbar.value = true
    }
    return
  }
  router.push(`/admin/stories/${response.data.id}`)
}

onMounted(load)
</script>

<style scoped>
.new-story {
  border: 1px solid rgba(var(--v-theme-charcoal), 0.12);
  background-color: rgb(var(--v-theme-surface));
}

.new-story__heading {
  font-size: 1.5rem;
}

.new-story__category {
  flex: 0 1 200px;
  min-width: 160px;
}

.new-story__title {
  flex: 1 1 280px;
}

.new-story__actions {
  padding-top: 4px;
}

.empty__heading {
  font-size: 1.75rem;
}

.empty p {
  max-width: 460px;
  margin-inline: auto;
}

.story-rows {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}

.story-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 8px;
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.1);
  color: inherit;
  transition: background-color 0.2s ease;
}

.story-row:hover,
.story-row:focus-visible {
  background-color: rgb(var(--v-theme-ivory-deep));
  outline: none;
}

.story-row__thumb {
  flex: 0 0 64px;
}

.story-row__empty {
  aspect-ratio: 0.8;
  background-color: rgb(var(--v-theme-ivory-deep));
}

.story-row__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.story-row__title {
  font-size: 1.375rem;
  line-height: 1.2;
}

.story-row__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

@media (max-width: 599px) {
  .story-row {
    gap: 14px;
  }

  .story-row__chevron {
    display: none;
  }
}
</style>
