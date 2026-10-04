<template>
  <!-- A thumbnail wireframe of a public page with the given spots highlighted.
       Block order mirrors the real page's sections. -->
  <div class="pm" :aria-label="`${SITE_PAGES[page].name} page layout`" role="img">
    <div class="pm__nav"></div>

    <template v-if="page === 'home'">
      <div class="pm__text pm__text--center"></div>
      <div class="pm__row pm__row--hero">
        <div v-for="n in HERO_SHOWCASE_COUNT" :key="n" :class="block(`hero-${n}`)"></div>
      </div>
      <div class="pm__row">
        <div :class="block('intro')" style="flex: 0.8; aspect-ratio: 0.8"></div>
        <div class="pm__lines"><span></span><span></span><span></span></div>
      </div>
      <div class="pm__row">
        <div :class="block('specialty-weddings')" style="aspect-ratio: 0.8"></div>
        <div :class="block('specialty-maternity')" style="aspect-ratio: 0.8"></div>
        <div :class="block('specialty-family')" style="aspect-ratio: 0.8"></div>
      </div>
      <div class="pm__row">
        <div :class="block('recent-large')" style="flex: 1.4; aspect-ratio: 0.8"></div>
        <div class="pm__col">
          <div :class="block('recent-top')"></div>
          <div :class="block('recent-bottom')"></div>
        </div>
      </div>
      <div class="pm__text pm__text--center"></div>
      <div :class="block('cta')" class="pm__banner"></div>
    </template>

    <template v-else-if="page === 'about'">
      <div class="pm__text pm__text--center"></div>
      <div class="pm__row pm__row--facts">
        <div v-for="n in 3" :key="n" class="pm__fact"></div>
      </div>
      <div class="pm__row">
        <div :class="block('story')" style="flex: 0.8; aspect-ratio: 0.8"></div>
        <div class="pm__lines"><span></span><span></span><span></span><span></span></div>
      </div>
      <div :class="block('cta')" class="pm__banner"></div>
    </template>

    <template v-else-if="page === 'portfolio'">
      <div class="pm__text pm__text--center"></div>
      <div class="pm__grid">
        <div v-for="c in PORTFOLIO_CATEGORIES" :key="c.slug" :class="block(`cover-${c.slug}`)" style="aspect-ratio: 0.8"></div>
      </div>
    </template>

    <template v-else>
      <div class="pm__text pm__text--center"></div>
      <div class="pm__row">
        <div :class="block('portrait')" style="flex: 0.8; aspect-ratio: 0.8"></div>
        <div class="pm__lines pm__lines--form"><span></span><span></span><span></span><span></span></div>
      </div>
    </template>

    <div class="pm__footer"></div>
  </div>
</template>

<script setup lang="ts">
import { PORTFOLIO_CATEGORIES } from '@/utils/portfolioCategories'
import { HERO_SHOWCASE_COUNT, SITE_PAGES, type SitePage } from '@/utils/sitePlacements'

const props = defineProps<{
  page: SitePage
  /** Area ids to highlight, e.g. ['hero-2', 'specialty-weddings'] */
  highlight: readonly string[]
}>()

function block(area: string) {
  return ['pm__block', { 'pm__block--on': props.highlight.includes(area) }]
}
</script>

<style scoped>
.pm {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 96px;
  padding: 4px;
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-charcoal), 0.12);
}

.pm__nav,
.pm__footer {
  height: 4px;
  background-color: rgba(var(--v-theme-charcoal), 0.12);
}

.pm__footer {
  height: 6px;
  background-color: rgb(var(--v-theme-ivory-deep));
}

.pm__row {
  display: flex;
  gap: 2px;
}

.pm__row > * {
  flex: 1;
}

.pm__col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm__col > * {
  flex: 1;
}

.pm__block {
  min-height: 6px;
  background-color: rgba(var(--v-theme-charcoal), 0.1);
  transition: background-color 0.2s ease;
}

.pm__block--on {
  background-color: rgb(var(--v-theme-blush));
  box-shadow: 0 0 0 1px rgb(var(--v-theme-blush-dark));
}

.pm__row--hero .pm__block {
  aspect-ratio: 0.75;
}

.pm__banner {
  height: 14px;
}

.pm__text {
  height: 3px;
  width: 50%;
  background-color: rgba(var(--v-theme-charcoal), 0.18);
}

.pm__text--center {
  margin: 2px auto;
}

.pm__lines {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.pm__lines span {
  height: 2px;
  background-color: rgba(var(--v-theme-charcoal), 0.12);
}

.pm__lines span:last-child {
  width: 70%;
}

.pm__lines--form span {
  height: 4px;
  width: 100%;
  background-color: transparent;
  border: 1px solid rgba(var(--v-theme-charcoal), 0.15);
}

.pm__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px;
}

.pm__row--facts .pm__fact {
  height: 6px;
  background-color: rgb(var(--v-theme-ivory-deep));
}
</style>
