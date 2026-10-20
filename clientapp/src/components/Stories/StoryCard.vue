<template>
  <router-link :to="storyPath(story)" class="story-card text-decoration-none">
    <div class="story-card__photo">
      <ResponsivePhoto
        :photo="story.cover ?? undefined"
        :sizes="PHOTO_SIZES.storyCard"
        :alt="story.cover?.altText || story.title"
        aspect-ratio="0.8"
        :eager="eager"
        class="story-card__image"
      />
    </div>

    <div class="story-card__text">
      <span v-if="date" class="font-nav tracking-widest text-caption text-blush-dark story-card__date">{{ date }}</span>

      <h2 class="font-display text-charcoal story-card__title">
        <template v-if="parts.length === 2">
          {{ parts[0] }} <span class="story-card__amp">&amp;</span> {{ parts[1] }}
        </template>
        <template v-else>{{ story.title }}</template>
      </h2>

      <p v-if="where" class="font-display text-charcoal-light story-card__where">{{ where }}</p>
      <p v-if="story.description?.trim()" class="text-charcoal-light story-card__description">{{ story.description.trim() }}</p>

      <span class="font-nav tracking-wide text-caption text-charcoal story-card__cta d-inline-flex align-center">
        View the Story
        <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
      </span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ResponsivePhoto from '@/components/Photo/ResponsivePhoto.vue'
import { PHOTO_SIZES } from '@/utils/photoUrls'
import { formatStoryDate, storyPath, storyPlace, titleParts, type StorySummary } from '@/utils/stories'

const props = withDefaults(defineProps<{
  story: StorySummary
  eager?: boolean
}>(), {
  eager: false,
})

const parts = computed(() => titleParts(props.story.title))
const date = computed(() => formatStoryDate(props.story.eventDate))
const where = computed(() =>
  [props.story.venueName?.trim(), storyPlace(props.story)].filter(Boolean).join(' · ') || null)
</script>

<style scoped>
/* A condensed story hero: photo beside the details, stacking on phones */
.story-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px 28px;
  color: inherit;
}

.story-card__photo {
  flex: 1 1 200px;
  max-width: 100%;
  overflow: hidden;
}

.story-card__text {
  flex: 1 1 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.story-card__image {
  transition: transform 0.6s ease;
}

.story-card:hover .story-card__image {
  transform: scale(1.04);
}

.story-card__title {
  font-size: clamp(1.875rem, 1.5vw + 1.25rem, 2.5rem);
  font-weight: 300;
  line-height: 1.05;
  text-wrap: balance;
}

.story-card__date {
  margin-bottom: 10px;
}

.story-card__amp {
  font-style: italic;
  color: rgb(var(--v-theme-blush));
}

.story-card__where {
  margin: 10px 0 0;
  font-size: 1.125rem;
  line-height: 1.35;
}

.story-card__description {
  margin: 12px 0 0;
  font-size: 0.9375rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card__cta {
  margin-top: 20px;
  padding-bottom: 2px;
  border-bottom: 1px solid currentColor;
}

.story-card:focus-visible {
  outline: 2px solid rgb(var(--v-theme-blush));
  outline-offset: 6px;
}

@media (prefers-reduced-motion: reduce) {
  .story-card__image {
    transition: none;
  }

  .story-card:hover .story-card__image {
    transform: none;
  }
}
</style>
