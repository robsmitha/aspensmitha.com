<template>
  <section class="story-hero" :class="{ 'story-hero--preview': preview }">
    <v-container class="story-hero__container">
      <div class="story-hero__layout">
        <div class="story-hero__text">
          <router-link
            v-if="back && !preview"
            :to="back.to"
            class="font-nav tracking-wide text-caption text-sage story-hero__back d-inline-flex align-center ga-2"
          >
            <v-icon size="14">mdi-arrow-left</v-icon>
            {{ back.label }}
          </router-link>

          <span class="font-nav tracking-widest text-caption text-blush-dark story-hero__eyebrow">{{ eyebrow }}</span>

          <component :is="preview ? 'div' : 'h1'" class="font-heading text-charcoal story-hero__title">
            <template v-if="parts.length === 2">
              {{ parts[0] }} <span class="story-hero__amp">&amp;</span> {{ parts[1] }}
            </template>
            <template v-else>{{ story.title || 'Untitled story' }}</template>
          </component>

          <p v-if="story.description?.trim()" class="story-hero__description text-charcoal-light">{{ story.description.trim() }}</p>

          <dl v-if="meta.length" class="story-hero__meta">
            <div v-for="cell in meta" :key="cell.label" class="story-hero__cell">
              <dt class="font-nav tracking-widest text-blush-dark">{{ cell.label }}</dt>
              <dd class="font-display text-charcoal">{{ cell.value }}</dd>
            </div>
          </dl>
        </div>

        <div class="story-hero__photo">
          <ResponsivePhoto
            :photo="photo ?? undefined"
            :sizes="PHOTO_SIZES.storyHero"
            :alt="photo ? photoAlt ?? story.title : ''"
            aspect-ratio="0.8"
            :eager="!preview"
          />
        </div>
      </div>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { PHOTO_SIZES, type PhotoSource } from '@/utils/photoUrls'
import { storyMeta, titleParts, type StoryDetails } from '@/utils/stories'

const props = withDefaults(defineProps<{
  story: StoryDetails
  /** Hero photo; undefined while loading holds the frame */
  photo: PhotoSource | null | undefined
  eyebrow: string
  back?: { to: string, label: string }
  photoAlt?: string
  /** Admin live preview: no back link, no h1, smaller type */
  preview?: boolean
}>(), {
  back: undefined,
  photoAlt: undefined,
  preview: false,
})

const parts = computed(() => titleParts(props.story.title.trim()))
const meta = computed(() => storyMeta(props.story))
</script>

<style scoped>
.story-hero {
  padding: 56px 0 24px;
}

.story-hero__layout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 40px clamp(32px, 6vw, 96px);
}

.story-hero__text {
  flex: 1 1 380px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* Capped so the portrait frames the title rather than filling the screen */
.story-hero__photo {
  flex: 0 1 400px;
  min-width: 0;
  max-width: 100%;
}

@media (max-width: 959px) {
  .story-hero__photo {
    flex-basis: 100%;
    max-width: 440px;
  }
}

.story-hero__back {
  text-decoration: none;
  margin-bottom: 32px;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.story-hero__back:hover {
  opacity: 1;
}

.story-hero__title {
  font-size: clamp(3rem, 5vw + 1rem, 5.75rem);
  font-weight: 400;
  line-height: 1.02;
  margin-top: 20px;
  text-wrap: balance;
}

.story-hero__amp {
  font-style: italic;
  color: rgb(var(--v-theme-blush));
}

.story-hero__description {
  margin: 28px 0 0;
  max-width: 460px;
  font-size: 1.0625rem;
  line-height: 1.8;
  white-space: pre-line;
}

/* Wraps instead of fixed columns, so a missing cell never leaves a gap */
.story-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
  margin: 40px 0 0;
  padding-top: 24px;
  border-top: 1px solid rgba(var(--v-theme-charcoal), 0.12);
  align-self: stretch;
}

.story-hero__cell dt {
  font-size: 0.625rem;
  text-transform: uppercase;
}

.story-hero__cell dd {
  margin: 6px 0 0;
  font-size: 1.25rem;
  line-height: 1.2;
}

/* Admin preview sits in a narrow column */
.story-hero--preview {
  padding: 20px 0;
}

.story-hero--preview .story-hero__layout {
  gap: 20px 28px;
}

.story-hero--preview .story-hero__text {
  flex-basis: 220px;
}

.story-hero--preview .story-hero__photo {
  flex-basis: 160px;
  max-width: 200px;
}

.story-hero--preview .story-hero__title {
  font-size: clamp(2rem, 2vw + 1rem, 2.75rem);
  margin-top: 12px;
}

.story-hero--preview .story-hero__description {
  font-size: 0.9375rem;
  margin-top: 16px;
}

.story-hero--preview .story-hero__meta {
  margin-top: 20px;
  padding-top: 14px;
  gap: 10px 24px;
}

.story-hero--preview .story-hero__cell dd {
  font-size: 1rem;
}

@media (max-width: 599px) {
  .story-hero {
    padding-top: 32px;
  }
}
</style>
