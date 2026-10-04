<template>
  <v-container class="py-16 py-md-16 instagram-section">
    <!-- No posts (Instagram unreachable or nothing to show): just point people to the profile -->
    <div v-if="instagram.loaded && !posts.length" class="text-center">
      <a
        :href="INSTAGRAM_PROFILE_URL"
        target="_blank"
        rel="noopener"
        class="font-nav tracking-wide text-caption text-charcoal instagram-link d-inline-flex align-center ga-2"
      >
        <v-icon size="16">mdi-instagram</v-icon>
        Follow along on Instagram {{ INSTAGRAM_HANDLE }}
      </a>
    </div>

    <template v-else>
      <v-row align="end" justify="space-between" class="mb-10 mb-md-12">
        <v-col cols="12" md="7">
          <span class="font-nav tracking-widest text-caption text-blush">{{ INSTAGRAM_HANDLE }}</span>
          <h2 class="font-display text-charcoal instagram-heading mt-4">Latest on Instagram</h2>
        </v-col>

        <v-col cols="12" md="auto" class="mt-6 mt-md-0">
          <a
            :href="INSTAGRAM_PROFILE_URL"
            target="_blank"
            rel="noopener"
            class="font-nav tracking-wide text-caption text-charcoal instagram-link d-inline-flex align-center ga-2"
          >
            Follow on Instagram
            <v-icon size="16">mdi-arrow-right</v-icon>
          </a>
        </v-col>
      </v-row>

      <v-row dense>
        <!-- Two rows of three at every size -->
        <v-col
          v-for="(post, index) in tiles"
          :key="post?.id ?? index"
          cols="4"
        >
          <a
            v-if="post"
            :href="post.url"
            target="_blank"
            rel="noopener"
            class="instagram-tile d-block w-100"
          >
            <ResponsivePhoto
              :photo="post"
              :sizes="PHOTO_SIZES.instagram"
              :alt="altText(post)"
              aspect-ratio="1"
              class="instagram-image"
            >
              <v-icon
                v-if="post.mediaType !== 'IMAGE'"
                :icon="post.mediaType === 'VIDEO' ? 'mdi-play' : 'mdi-checkbox-multiple-blank'"
                size="18"
                color="white"
                class="instagram-badge"
              />
            </ResponsivePhoto>
          </a>

          <v-responsive v-else :aspect-ratio="1" class="w-100">
            <v-skeleton-loader type="image" color="ivory-deep" class="instagram-skeleton" />
          </v-responsive>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { PHOTO_SIZES } from '@/utils/photoUrls'
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_PROFILE_URL,
  useInstagramStore,
  type InstagramPost,
} from '@/store/instagram'

/** Two rows of three, however many posts the API mirrors (Instagram:PostCount) */
const TILE_COUNT = 6
const ALT_TEXT_LENGTH = 100

const instagram = useInstagramStore()
instagram.load()

const posts = computed(() => instagram.posts.slice(0, TILE_COUNT))

/** Skeleton slots until the posts arrive, so the grid keeps its shape */
const tiles = computed<(InstagramPost | undefined)[]>(() =>
  instagram.loaded ? posts.value : Array.from({ length: TILE_COUNT }, () => undefined),
)

function altText (post: InstagramPost): string {
  const caption = post.caption?.replace(/\s+/g, ' ').trim()
  if (!caption) return 'Instagram post by Aspen Smitha Photography'
  if (caption.length <= ALT_TEXT_LENGTH) return caption

  const cut = caption.slice(0, ALT_TEXT_LENGTH)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : ALT_TEXT_LENGTH)}…`
}
</script>

<style scoped>
/* Narrower than the other sections, so the grid sits with whitespace on each side */
.instagram-section {
  max-width: 960px;
}

.instagram-heading {
  font-size: clamp(2.25rem, 2.5vw + 1.25rem, 3rem);
}

.instagram-link {
  text-decoration: none;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.35);
  transition: border-color 0.2s ease;
}

.instagram-link:hover {
  border-color: rgb(var(--v-theme-charcoal));
}

.instagram-tile {
  overflow: hidden;
}

.instagram-image {
  transition: transform 0.6s ease, opacity 0.3s ease;
}

.instagram-tile:hover .instagram-image,
.instagram-tile:focus-visible .instagram-image {
  transform: scale(1.03);
  opacity: 0.92;
}

.instagram-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.instagram-skeleton,
.instagram-skeleton :deep(.v-skeleton-loader__image) {
  height: 100%;
  border-radius: 0;
}
</style>
