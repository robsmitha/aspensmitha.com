<template>
  <!-- Home/Portfolio photos are published to fixed CDN URLs in the background after each change -->
  <section v-if="status?.enabled" class="publish-status mb-6" aria-live="polite">
    <div class="d-flex flex-wrap align-center ga-3">
      <v-chip :color="pending.length ? 'blush' : 'success'" size="small" label>
        <v-progress-circular v-if="pending.length" indeterminate size="12" width="2" class="mr-2"></v-progress-circular>
        <v-icon v-else size="14" class="mr-1">mdi-check</v-icon>
        {{ pending.length
          ? `Updating ${pending.length} site photo${pending.length === 1 ? '' : 's'}…`
          : 'Home & Portfolio photos are live' }}
      </v-chip>
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        color="sage"
        rounded="0"
        size="small"
        class="font-nav tracking-wide text-caption"
        prepend-icon="mdi-cloud-upload-outline"
        :loading="republishing"
        @click="republish"
      >
        Republish site photos
      </v-btn>
    </div>

    <p v-if="pending.length" class="text-caption text-stone mt-2 mb-0">
      Visitors see the change within about a minute. Your own browser may show the old photo for up to 5 minutes.
    </p>

    <p v-if="fallbacks.length" class="text-caption publish-status__fallback mt-2 mb-0">
      No photo picked, showing a fallback:
      {{ fallbacks.map(s => `${placementTitle(s.key)} (${FALLBACK_LABELS[s.source]})`).join(' · ') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import apiClient from '@/api/elysianClient'
import { placementTitle } from '@/utils/sitePlacements'

interface SlotStatus {
  key: string
  name: string
  source: 'Explicit' | 'Category' | 'SiteDefault' | 'Neutral'
  photoId: string | null
  live: boolean
  publishedAt: string | null
  sourceWidth: number | null
  largestWidth: number
}

const FALLBACK_LABELS: Record<SlotStatus['source'], string> = {
  Explicit: '',
  Category: 'first photo in its collection',
  SiteDefault: 'site fallback photo',
  Neutral: 'blank frame',
}

const POLL_MS = 5000
/** Publishing normally takes well under a minute; stop asking after this */
const POLL_FOR_MS = 5 * 60_000

const emit = defineEmits<{ error: [message: string | undefined] }>()

const status = ref<{ enabled: boolean, slots: SlotStatus[] }>()
const republishing = ref(false)
let pollTimer: ReturnType<typeof setTimeout> | undefined
let pollUntil = 0

const pending = computed(() => status.value?.slots.filter(s => !s.live) ?? [])
const fallbacks = computed(() => status.value?.slots.filter(s => s.source !== 'Explicit') ?? [])

async function load() {
  const response = await apiClient.getData('/api/manage/placements/status')
  if (response.success) status.value = response.data
}

/** Call after any change that can affect a Home/Portfolio photo; follows it until it's live */
async function refresh() {
  clearTimeout(pollTimer)
  pollUntil = Date.now() + POLL_FOR_MS
  await poll()
}

async function poll() {
  await load()
  if (pending.value.length && Date.now() < pollUntil) {
    pollTimer = setTimeout(poll, POLL_MS)
  }
}

async function republish() {
  republishing.value = true
  const response = await apiClient.postData('/api/manage/placements/publish', {})
  republishing.value = false
  if (!response.success) {
    emit('error', response.errorMessage)
    return
  }
  // The rebuild runs in the background; give it a moment to start before polling
  setTimeout(refresh, 2000)
}

defineExpose({ refresh })

onMounted(refresh)
onBeforeUnmount(() => clearTimeout(pollTimer))
</script>

<style scoped>
.publish-status {
  padding: 12px 16px;
  background-color: rgb(var(--v-theme-ivory));
  border: 1px solid rgba(var(--v-theme-charcoal), 0.08);
}

.publish-status__fallback {
  color: rgb(var(--v-theme-blush-dark));
}
</style>
