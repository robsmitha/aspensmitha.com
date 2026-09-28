<template>
  <v-footer color="ivory-deep" class="py-12 py-md-16">
    <v-container>
      <div class="text-center mb-10">
        <span class="font-display text-charcoal footer-brand">Aspen Smitha</span>
        <p class="font-nav tracking-widest text-caption text-stone mt-2">
          Wedding &amp; Portrait Photography
        </p>
      </div>

      <nav class="d-flex flex-wrap justify-center ga-6 ga-md-10 mb-10">
        <router-link
          v-for="link in navLinks"
          :key="link.title"
          :to="link.to"
          class="font-nav tracking-wide text-caption text-charcoal footer-link"
        >
          {{ link.title.toUpperCase() }}
        </router-link>
      </nav>

      <div class="d-flex justify-center ga-2 mb-10">
        <v-btn icon="mdi-instagram" variant="text" color="charcoal" size="small" href="https://www.instagram.com/aspensmitha.photography" target="_blank"></v-btn>
        <v-btn icon="mdi-facebook" variant="text" color="charcoal" size="small" href="https://www.facebook.com/aspensage.photography" target="_blank"></v-btn>
      </div>

      <v-divider color="stone-light" opacity="0.6" class="mb-6"></v-divider>

      <div class="d-flex flex-column flex-sm-row justify-space-between align-center ga-2">
        <span class="font-nav text-caption text-stone">
          &copy;{{ new Date().getFullYear() }} Aspen Smitha Photography
        </span>
        <div class="d-flex flex-wrap justify-center align-center ga-3">
          <span class="font-nav text-caption text-stone">
            Website design by
            <a href="https://robsmitha.com" target="_blank" rel="noopener" class="text-stone footer-utility">robsmitha.com</a>
          </span>

          <span class="text-stone-light" aria-hidden="true">&middot;</span>

          <template v-if="signedIn">
            <router-link :to="ADMIN_HOME" class="font-nav text-caption text-blush footer-utility">Admin</router-link>
            <span class="text-stone-light" aria-hidden="true">&middot;</span>
            <a :href="SIGN_OUT_URL" class="font-nav text-caption text-stone footer-utility">Sign out</a>
          </template>
          <a v-else :href="SIGN_IN_URL" class="font-nav text-caption text-stone footer-utility">Sign in</a>
        </div>
      </div>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
import { ADMIN_HOME, SIGN_IN_URL, SIGN_OUT_URL, useSignedInUser } from '@/utils/signedInUser'

const { signedIn } = useSignedInUser()

const navLinks = [
  { title: 'Home', to: '/' },
  { title: 'Portfolio', to: '/portfolio' },
  { title: 'About', to: '/about-me' },
  { title: 'Investment', to: '/investment' },
  { title: 'Contact', to: '/contact' },
]
</script>

<style scoped>
.footer-brand {
  font-size: 2rem;
  letter-spacing: 0.04em;
}

.footer-link {
  text-decoration: none;
  opacity: 0.75;
  padding-bottom: 3px;
  border-bottom: 1px solid transparent;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.footer-link:hover {
  opacity: 1;
  border-color: currentColor;
}

.footer-utility {
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.footer-utility:hover {
  border-color: currentColor;
}
</style>
