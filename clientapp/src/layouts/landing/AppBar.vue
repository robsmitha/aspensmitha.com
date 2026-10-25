<template>
  <header class="landing-header">
    <v-container class="py-2">
      <v-row align="center" no-gutters>
        <v-col cols="auto">
          <router-link to="/" class="text-decoration-none">
            <img
              :src="logo"
              alt="Aspen Smitha Photography"
              width="560"
              height="320"
              class="brand-logo"
              decoding="async"
            >
          </router-link>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="auto">
          <!-- One row so every link shares spacing and alignment; on phones the links move into the menu button -->
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
              class="font-nav tracking-wide text-caption text-sage nav-link d-none d-md-inline"
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

            <!-- Phones: hamburger that opens the full list of pages -->
            <v-btn
              icon="mdi-menu"
              variant="text"
              color="sage"
              size="small"
              class="d-md-none menu-btn"
              aria-label="Open menu"
              :aria-expanded="menuOpen"
              @click="menuOpen = true"
            ></v-btn>
          </nav>
        </v-col>
      </v-row>
    </v-container>

    <v-navigation-drawer
      v-model="menuOpen"
      location="right"
      temporary
      width="280"
      color="ivory"
      class="d-md-none"
    >
      <div class="d-flex align-center justify-space-between pa-4">
        <span class="font-heading text-charcoal drawer-title">Menu</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="sage"
          size="small"
          aria-label="Close menu"
          @click="menuOpen = false"
        ></v-btn>
      </div>

      <nav aria-label="Main">
        <v-list nav class="px-2">
          <v-list-item
            v-for="link in menuLinks"
            :key="link.title"
            :to="link.to"
            :active="route.path === link.to"
            rounded="0"
            class="drawer-link"
            @click="menuOpen = false"
          >
            <v-list-item-title class="font-nav tracking-wide text-sage drawer-link__title">
              {{ link.title.toUpperCase() }}
            </v-list-item-title>
          </v-list-item>

          <!-- Only Aspen (signed in) ever sees this -->
          <v-list-item
            v-if="signedIn"
            :to="ADMIN_HOME"
            rounded="0"
            class="drawer-link"
            @click="menuOpen = false"
          >
            <v-list-item-title class="font-nav tracking-wide text-sage drawer-link__title">
              <v-icon size="14" class="mr-1">mdi-lock-outline</v-icon>
              ADMIN
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </nav>
    </v-navigation-drawer>
  </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import logo from '@/assets/aspen-smitha-logo.png'
import { ADMIN_HOME, useSignedInUser } from '@/utils/signedInUser'

const route = useRoute()
const { signedIn } = useSignedInUser()

const menuOpen = ref(false)
// Close after any navigation (including the browser back button)
watch(() => route.fullPath, () => { menuOpen.value = false })

const navLinks = [
  { title: 'Home', to: '/' },
  { title: 'Portfolio', to: '/portfolio' },
  { title: 'About', to: '/about-me' },
  { title: 'Investment', to: '/investment' },
  { title: 'Book', to: '/booking' },
]

// Phone menu: the same pages as the nav bar, plus Contact
const menuLinks = [...navLinks, { title: 'Contact', to: '/contact' }]
</script>

<style scoped>
.landing-header {
  background-color: rgb(var(--v-theme-ivory));
}

/* Logo image (560x320); the size is set by height so the nav row stays steady */
.brand-logo {
  display: block;
  height: 64px;
  width: auto;
}

@media (min-width: 960px) {
  .brand-logo {
    height: 96px;
  }
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

.drawer-title {
  font-size: 1.5rem;
}

.drawer-link__title {
  font-size: 0.9375rem;
  letter-spacing: 0.08em;
}

.nav-divider {
  width: 1px;
  height: 14px;
  background-color: rgba(var(--v-theme-charcoal), 0.18);
}
</style>
