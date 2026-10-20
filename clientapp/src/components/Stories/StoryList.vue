<template>
  <v-container class="story-list py-14 py-md-18">
    <div class="story-list__grid">
      <StoryCard v-for="(story, i) in shown" :key="story.id" :story="story" :eager="i < 2" />
    </div>

    <div v-if="stories.length > shown.length" class="text-center mt-14">
      <v-btn
        variant="outlined"
        color="charcoal"
        size="large"
        rounded="0"
        class="font-nav tracking-wide text-caption"
        @click="limit += PAGE_SIZE"
      >
        Show More Stories
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import StoryCard from '@/components/Stories/StoryCard.vue'
import type { StorySummary } from '@/utils/stories'

const props = defineProps<{
  stories: StorySummary[]
}>()

const PAGE_SIZE = 12
const limit = ref(PAGE_SIZE)
const shown = computed(() => props.stories.slice(0, limit.value))
</script>

<style scoped>
.story-list {
  max-width: 1240px;
}

/* Two cards per row on desktop, one below that */
.story-list__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr));
  gap: 64px 56px;
}
</style>
