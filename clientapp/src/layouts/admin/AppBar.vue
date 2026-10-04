<template>
  <header class="admin-header">
    <v-container class="py-4">
      <v-row align="center" no-gutters>
        <v-col cols="auto" class="d-flex align-center">
          <router-link to="/admin/photos" class="text-decoration-none">
            <span class="font-display text-charcoal brand-mark">aspensmitha.com</span>
          </router-link>
          <span class="font-nav tracking-widest text-caption text-blush admin-tag ml-3 pl-3">Admin</span>
        </v-col>

        <v-spacer></v-spacer>

        <v-col cols="auto" class="d-flex align-center">
          <!-- Section links move into the user menu on small screens -->
          <nav class="d-flex align-center ga-5 ga-md-8 mr-4 mr-md-6">
            <router-link
              v-for="link in navLinks"
              :key="link.title"
              :to="link.to"
              class="font-nav tracking-wide text-caption text-charcoal nav-link d-none d-md-inline"
              :class="{ 'nav-link--active': route.path === link.to }"
            >
              {{ link.title.toUpperCase() }}
            </router-link>

            <router-link
              to="/"
              class="font-nav tracking-wide text-caption text-charcoal nav-link d-inline-flex align-center"
              title="View the public site"
            >
              <span class="d-none d-sm-inline">VIEW SITE</span>
              <v-icon size="14" class="ml-sm-1">mdi-arrow-top-right</v-icon>
            </router-link>
          </nav>

          <v-menu v-if="userDetails" location="bottom end" offset="8">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon
                variant="outlined"
                color="charcoal"
                size="small"
                rounded="0"
                class="user-btn"
                :aria-label="`Signed in as ${userDetails}`"
              >
                <span class="font-display user-initial">{{ userDetails.charAt(0).toUpperCase() }}</span>
              </v-btn>
            </template>

            <v-card theme="aspen" rounded="0" min-width="240" class="user-menu">
              <div class="px-4 pt-4 pb-3">
                <span class="font-nav tracking-widest text-caption text-stone d-block">Signed in as</span>
                <span class="font-display text-charcoal user-name">{{ userDetails }}</span>
              </div>
              <v-divider color="stone-light"></v-divider>
              <v-list density="compact" class="py-2" bg-color="surface">
                <v-list-item
                  v-for="link in navLinks"
                  :key="link.title"
                  :to="link.to"
                  :prepend-icon="link.icon"
                  :active="route.path === link.to"
                  color="blush"
                  rounded="0"
                >
                  <v-list-item-title class="font-nav tracking-wide text-caption">{{ link.title.toUpperCase() }}</v-list-item-title>
                </v-list-item>
              </v-list>
              <v-divider color="stone-light"></v-divider>
              <div class="pa-2">
                <v-btn
                  block
                  variant="text"
                  color="charcoal"
                  rounded="0"
                  class="font-nav tracking-wide text-caption justify-start"
                  prepend-icon="mdi-logout"
                  :href="SIGN_OUT_URL"
                >
                  Sign out
                </v-btn>
              </div>
            </v-card>
          </v-menu>
        </v-col>
      </v-row>
    </v-container>
  </header>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { SIGN_OUT_URL, useSignedInUser } from '@/utils/signedInUser'

const route = useRoute()

const navLinks = [
  { title: 'Photos', to: '/admin/photos', icon: 'mdi-image-multiple-outline' },
  { title: 'Instagram', to: '/admin/instagram', icon: 'mdi-instagram' },
  { title: 'Products', to: '/products', icon: 'mdi-tag-multiple-outline' },
  { title: 'Users', to: '/users', icon: 'mdi-account-group-outline' },
]

const { userDetails } = useSignedInUser()
</script>

<style scoped>
.admin-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: rgb(var(--v-theme-ivory));
  border-bottom: 1px solid rgba(var(--v-theme-charcoal), 0.1);
}

.brand-mark {
  font-size: clamp(1.25rem, 1vw + 0.9rem, 1.5rem);
  letter-spacing: 0.04em;
}

.admin-tag {
  border-left: 1px solid rgba(var(--v-theme-charcoal), 0.2);
  line-height: 1.4;
}

/* Matches the public site's header links */
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

.user-btn {
  border-color: rgba(var(--v-theme-charcoal), 0.35);
}

.user-initial {
  font-size: 1.125rem;
  line-height: 1;
}

.user-menu {
  border: 1px solid rgba(var(--v-theme-charcoal), 0.1);
  box-shadow: 0 16px 40px -16px rgba(33, 31, 28, 0.25);
}

.user-name {
  font-size: 1.125rem;
  word-break: break-all;
}
</style>
