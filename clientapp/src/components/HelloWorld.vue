<template>
  <section class="hero-section d-flex align-center bg-background">
    <div class="hero-glow" aria-hidden="true"></div>
    <div class="hero-scales" aria-hidden="true">
    </div>

    <v-container class="hero-container">
      <v-row>
        <v-col cols="12" lg="9" xl="8">
          <!-- <p class="font-mono text-primary text-body-2 mb-4 hero-eyebrow">
            <span aria-hidden="true">&gt;</span> Hi, my name is
          </p> -->

          <h1 class="font-weight-bold hero-name mb-1">
            Rob Smitha.
          </h1>
          <h2 class="text-slate font-weight-bold hero-role mb-6">
            {{ props.title }}
          </h2>

          <p class="text-slate hero-bio" v-html="props.subtitle"></p>

          <div class="mt-8 d-flex flex-wrap ga-4">
            <v-btn
              v-for="b in props.actions"
              :key="b.text"
              variant="outlined"
              color="white"
              size="large"
              class="font-mono text-none hero-cta"
              :to="b.to"
              :href="b.href"
              :target="b.href ? '_blank' : undefined"
              :prepend-icon="b.icon"
            >
              {{ b.text }}
            </v-btn>
          </div>

          <div class="mt-12 d-flex flex-wrap ga-8 hero-stats">
            <div v-for="s in stats" :key="s.label">
              <span class="font-mono text-h4 text-lightest-slate font-weight-bold d-block">{{ s.value }}</span>
              <span class="font-mono text-caption text-slate text-uppercase">{{ s.label }}</span>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGithubStore } from '@/store/github'

type HeroAction = {
  text: string,
  to: string | undefined,
  href: string | undefined,
  icon: string | undefined
}

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  actions: { type: Array<HeroAction>, default: [] }
})

const store = useGithubStore()

// Real numbers pulled from the GitHub API via the shared store, not hardcoded copy.
const stats = computed(() => {
  const repos = store.repos ?? []
  const languageCount = new Set(repos.map(r => r.language).filter(Boolean)).size
  const yearsExperience = new Date().getFullYear() - 2016
  return [
    { value: repos.length > 0 ? repos.length : '—', label: 'Public Repos' },
    { value: languageCount > 0 ? languageCount : '—', label: 'Languages' },
    { value: yearsExperience, label: 'Years Experience' },
  ]
})
</script>

<style scoped>
.hero-section {
  position: relative;
  overflow: hidden;
  min-height: 70vh;
  /* v-main already reserves 64px via the fixed app-bar's layout offset (padding-top),
     which pushes this section's box below the app-bar instead of behind it. Pull it
     back up by that same amount so the glow/scale background renders underneath the
     transparent navbar too, then pad the content back down so it isn't covered by it. */
  margin-top: -64px;
  padding-top: 64px;
}

.hero-container {
  position: relative;
  z-index: 1;
}

/* Ambient RGB backlight bleed, like a mechanical keyboard glowing in a dark room. */
.hero-glow {
  position: absolute;
  inset: -25%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 22%, rgba(255, 70, 165, 0.32), transparent 38%),
    radial-gradient(circle at 84% 12%, rgba(64, 255, 210, 0.30), transparent 40%),
    radial-gradient(circle at 72% 78%, rgba(140, 95, 255, 0.28), transparent 42%),
    radial-gradient(circle at 22% 82%, rgba(255, 195, 60, 0.20), transparent 40%),
    radial-gradient(circle at 50% 48%, rgba(60, 175, 255, 0.16), transparent 46%);
  filter: blur(70px);
  animation: hero-glow-drift 24s ease-in-out infinite alternate;
}

@keyframes hero-glow-drift {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-2%, 3%, 0) scale(1.08); }
  100% { transform: translate3d(3%, -2%, 0) scale(1); }
}

/* Overlapping scale/shingle texture — rows of curved tiles offset like fish or
   dragon scales, each briefly catching a flash of color as if light were
   sweeping/shuttering across them. */
.hero-scales {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  opacity: 0.55;
  padding-top: 5vh;
}

.scale-row {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: -14px;
}

.scale-row:first-child {
  margin-top: 0;
}

.scale-row--offset {
  transform: translateX(-19px);
}

.scale {
  flex: 0 0 auto;
  width: 38px;
  height: 44px;
  border-radius: 50% 50% 46% 46% / 62% 62% 38% 38%;
  background: rgb(var(--v-theme-lightest-navy));
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  opacity: 0.4;
  animation: scale-shimmer 9s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.18s);
}

@keyframes scale-shimmer {
  0%, 85%, 100% {
    background: rgb(var(--v-theme-lightest-navy));
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    opacity: 0.4;
  }
  92% {
    background: hsl(calc(var(--i) * 41), 88%, 63%);
    box-shadow: 0 0 14px 3px hsl(calc(var(--i) * 41), 88%, 55%);
    opacity: 0.9;
  }
}

@media (max-width: 960px) {
  .scale {
    width: 30px;
    height: 35px;
  }
}

.hero-eyebrow {
  letter-spacing: 0.02em;
}

.hero-name {
  font-size: clamp(2.25rem, 3vw + 1.5rem, 4.5rem);
  line-height: 1.1;
  display: inline-block;
  background: linear-gradient(90deg, #ff5fa2, #ffb454, #64ffda, #5fc8ff, #b57bff, #ff5fa2);
  background-size: 300% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: hero-name-shimmer 10s linear infinite;
}

@keyframes hero-name-shimmer {
  to { background-position: 300% center; }
}

.hero-cta {
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(var(--v-theme-primary), 0.4),
    0 0 20px 2px rgba(150, 100, 255, 0.25),
    0 0 36px 6px rgba(255, 100, 180, 0.15);
}

@media (prefers-reduced-motion: reduce) {
  .hero-glow,
  .scale,
  .hero-name {
    animation: none;
  }
}

.hero-role {
  font-size: clamp(1.5rem, 2vw + 1rem, 3rem);
  line-height: 1.15;
}

.hero-bio {
  max-width: 560px;
  font-size: 1.0625rem;
  line-height: 1.6;
}

.hero-stats > div {
  padding-left: 2rem;
  border-left: 1px solid rgb(var(--v-theme-lightest-navy));
}

.hero-stats > div:first-child {
  padding-left: 0;
  border-left: none;
}

@media (max-width: 600px) {
  .hero-section {
    min-height: 92vh;
  }

  .hero-stats {
    gap: 1.5rem !important;
  }

  .hero-stats > div {
    padding-left: 0;
    border-left: none;
    min-width: 40%;
  }
}
</style>
