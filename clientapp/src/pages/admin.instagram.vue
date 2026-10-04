<route lang="yaml">
meta:
  layout: admin
</route>

<template>
  <v-container class="py-10 py-md-14">
    <AdminPageHeader
      eyebrow="Integrations"
      title="Instagram"
      :subtitle="subtitle"
    >
      <template #actions>
        <v-btn
          variant="text"
          color="charcoal"
          rounded="0"
          class="font-nav tracking-wide text-caption"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="load"
        >
          Refresh
        </v-btn>
      </template>
    </AdminPageHeader>

    <v-row>
      <v-col cols="12" md="7" lg="6">
        <v-sheet border rounded="0" class="pa-6 pa-md-8">
          <span class="font-nav tracking-widest text-caption text-stone text-uppercase">Connection</span>

          <v-skeleton-loader v-if="!connection" type="heading, list-item-two-line@3" color="transparent" class="mt-4" />

          <template v-else-if="connection.connected">
            <div class="d-flex flex-wrap align-center ga-3 mt-3">
              <h2 class="font-display text-charcoal account-name">
                <a
                  v-if="connection.username"
                  :href="`https://www.instagram.com/${connection.username}`"
                  target="_blank"
                  rel="noopener"
                  class="text-charcoal text-decoration-none"
                >@{{ connection.username }}</a>
                <span v-else>Account {{ connection.userId }}</span>
              </h2>
              <v-chip
                :color="connection.error ? 'error' : 'success'"
                :prepend-icon="connection.error ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"
                size="small"
                rounded="0"
                variant="tonal"
              >
                {{ connection.error ? 'Needs attention' : 'Connected' }}
              </v-chip>
            </div>

            <v-alert
              v-if="connection.error"
              type="error"
              variant="tonal"
              rounded="0"
              density="compact"
              class="mt-4 text-body-2"
            >
              {{ connection.error }}
            </v-alert>

            <dl class="facts mt-6">
              <dt>Token refreshed</dt>
              <dd>{{ formatDate(connection.lastRefreshedUtc) }}</dd>

              <dt>Token expires</dt>
              <dd>{{ connection.expiresUtc ? formatDate(connection.expiresUtc) : 'Known after the first automatic refresh' }}</dd>

              <dt>Last synced</dt>
              <dd>{{ connection.lastSyncedUtc ? formatDate(connection.lastSyncedUtc) : 'Not yet' }}</dd>

              <dt>Posts on the site</dt>
              <dd>{{ connection.postCount }}</dd>
            </dl>
          </template>

          <p v-else class="text-body-2 text-charcoal-light mt-3 mb-0">
            No Instagram account is connected, so the home page shows a "Follow along on Instagram" link instead of the feed.
          </p>
        </v-sheet>
      </v-col>

      <v-col cols="12" md="5" lg="6">
        <v-sheet border rounded="0" class="pa-6 pa-md-8">
          <span class="font-nav tracking-widest text-caption text-stone text-uppercase">
            {{ connection?.connected ? 'Replace token' : 'Connect account' }}
          </span>

          <p class="text-body-2 text-charcoal-light mt-3 mb-5">
            In the Meta app dashboard, open <strong>Instagram &rsaquo; API setup with Instagram login</strong> and generate a token for the account.
            It's checked with Instagram before it's saved, then refreshed automatically every week.
          </p>

          <v-form @submit.prevent="connect">
            <v-text-field
              v-model="token"
              label="Long-lived access token"
              type="password"
              autocomplete="off"
              spellcheck="false"
              variant="outlined"
              rounded="0"
              :error-messages="tokenErrors"
              :disabled="connecting"
              @update:model-value="tokenErrors = []"
            ></v-text-field>

            <v-btn
              type="submit"
              variant="flat"
              color="charcoal"
              rounded="0"
              class="font-nav tracking-wide text-caption mt-2"
              :loading="connecting"
              :disabled="!token.trim()"
            >
              {{ connection?.connected ? 'Replace and sync' : 'Connect and sync' }}
            </v-btn>
          </v-form>
        </v-sheet>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="6000">{{ snackbarMessage }}</v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import apiClient from '@/api/elysianClient'
import AdminPageHeader from '@/components/Admin/AdminPageHeader.vue'

type InstagramConnection = {
  connected: boolean
  username: string | null
  userId: string | null
  lastRefreshedUtc: string | null
  expiresUtc: string | null
  lastSyncedUtc: string | null
  postCount: number
  error: string | null
}

const connection = ref<InstagramConnection | null>(null)
const loading = ref(false)

// The token only ever lives in this field: it's cleared after submitting and never read back from the API
const token = ref('')
const tokenErrors = ref<string[]>([])
const connecting = ref(false)

const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const subtitle = computed(() => {
  if (!connection.value) return 'Loading…'
  if (!connection.value.connected) return 'Not connected'
  return connection.value.error ? 'Connected, needs attention' : `${connection.value.postCount} posts on the home page`
})

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function formatDate (value: string | null): string {
  return value ? dateFormat.format(new Date(value)) : '—'
}

function notify (message: string, color: 'success' | 'error') {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}

async function load () {
  loading.value = true
  const response = await apiClient.getData('/api/manage/instagram')
  loading.value = false

  if (response.success) {
    connection.value = response.data
  } else {
    notify(response.errorMessage ?? 'Could not load the Instagram connection.', 'error')
  }
}

async function connect () {
  connecting.value = true
  const response = await apiClient.postData('/api/manage/instagram/token', { accessToken: token.value.trim() })
  connecting.value = false

  if (response.success) {
    token.value = ''
    connection.value = response.data
    notify(`Connected @${response.data.username} and synced ${response.data.postCount} posts.`, 'success')
  } else if (response.statusCode === 400 && response.errors) {
    tokenErrors.value = Array.from(response.errors.values()).flat()
  } else {
    notify(response.errorMessage ?? 'Could not connect Instagram.', 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.account-name {
  font-size: clamp(1.5rem, 1vw + 1.1rem, 2rem);
  line-height: 1.2;
}

.facts {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 10px 24px;
  margin: 0;
}

.facts dt {
  font-family: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-stone));
  align-self: center;
}

.facts dd {
  margin: 0;
  font-size: 0.9375rem;
  color: rgb(var(--v-theme-charcoal));
}
</style>
