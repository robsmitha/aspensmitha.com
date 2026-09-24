<template>
  <header class="landing-header">
    <v-container class="py-4 py-md-5">
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <router-link to="/" class="text-decoration-none">
            <span class="font-display text-charcoal brand-mark">Aspen Smitha</span>
          </router-link>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="auto">
          <nav class="d-none d-md-flex align-center ga-8 mr-8">
            <router-link
              v-for="link in navLinks"
              :key="link.title"
              :to="link.to"
              class="font-nav tracking-wide text-caption text-charcoal nav-link"
              :class="{ 'nav-link--active': route.path === link.to }"
            >
              {{ link.title.toUpperCase() }}
            </router-link>
          </nav>
        </v-col>

        <v-col cols="auto">
          <v-btn
            variant="outlined"
            color="charcoal"
            size="small"
            class="font-nav tracking-wide text-caption inquire-btn"
            rounded="0"
            to="/contact"
          >
            Contact
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navLinks = [
  { title: 'Home', to: '/' },
  { title: 'Portfolio', to: '/portfolio' },
  { title: 'About', to: '/about-me' },
  { title: 'Investment', to: '/investment' },
]
</script>

<style scoped>
.landing-header {
  background-color: rgb(var(--v-theme-ivory));
}

.brand-mark {
  font-size: 1.5rem;
  letter-spacing: 0.04em;
}

.nav-link {
  text-decoration: none;
  opacity: 0.75;
  padding-bottom: 3px;
  border-bottom: 1px solid transparent;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.nav-link:hover,
.nav-link--active {
  opacity: 1;
  border-color: currentColor;
}

.inquire-btn {
  letter-spacing: 0.08em;
}
</style>
