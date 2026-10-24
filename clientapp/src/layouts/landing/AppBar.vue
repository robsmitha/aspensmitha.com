<template>
  <header class="landing-header">
    <v-container class="py-4 py-md-5">
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <router-link to="/" class="text-decoration-none">
            <span class="font-heading text-charcoal brand-mark">Aspen Smitha Photography</span>
          </router-link>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="auto">
          <!-- One row so every link shares spacing and alignment; on phones only CONTACT shows -->
          <nav class="d-flex align-center ga-8">
            <router-link
              v-for="link in navLinks"
              :key="link.title"
              :to="link.to"
              class="font-nav tracking-wide text-caption text-sage nav-link d-none d-md-inline"
              :class="{ 'nav-link--active': route.path === link.to }"
            >
              {{ link.title.toUpperCase() }}
            </router-link>

            <router-link
              to="/contact"
              class="font-nav tracking-wide text-caption text-sage nav-link"
              :class="{ 'nav-link--active': route.path === '/contact' }"
            >
              CONTACT
            </router-link>

            <!-- Only Aspen (signed in) ever sees this -->
            <span v-if="signedIn" class="nav-divider d-none d-md-inline" aria-hidden="true"></span>
            <router-link
              v-if="signedIn"
              :to="ADMIN_HOME"
              class="font-nav tracking-wide text-caption text-sage nav-link d-none d-md-inline-flex align-center"
            >
              <v-icon size="12" class="mr-1">mdi-lock-outline</v-icon>
              ADMIN
            </router-link>
          </nav>
        </v-col>
      </v-row>
    </v-container>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ADMIN_HOME, useSignedInUser } from '@/utils/signedInUser'

const route = useRoute()
const { signedIn } = useSignedInUser()

const navLinks = [
  { title: 'Home', to: '/' },
  { title: 'Portfolio', to: '/portfolio' },
  { title: 'About', to: '/about-me' },
  { title: 'Investment', to: '/investment' },
  { title: 'Book', to: '/booking' },
]
</script>

<style scoped>
.landing-header {
  background-color: rgb(var(--v-theme-ivory));
}

/* Shrinks on phones so the full name still fits beside the Contact link */
.brand-mark {
  font-size: clamp(1.0625rem, 2vw + 0.6rem, 1.5rem);
  letter-spacing: 0.04em;
  white-space: nowrap;
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

.nav-divider {
  width: 1px;
  height: 14px;
  background-color: rgba(var(--v-theme-charcoal), 0.18);
}
</style>
