<template>
    <v-app-bar
      id="navTop"
      :color="!drawer && transparency ? 'transparent' : 'background'"
      :class="[
        'text-lightest-slate',
        { 'nav-solid': drawer || !transparency }
      ]"
      flat
      fixed
    >
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>
        <span class="font-mono text-subtitle-1 cursor-pointer" @click="onBrandClick">
          <span :class="{ 'text-white': transparency, 'text-primary': !transparency }">rob</span><span class="text-lightest-slate">smitha.com</span>
        </span>
      </v-app-bar-title>

      <!-- <ul v-if="!isMobile" class="d-flex align-center ga-6 nav-links pl-0 mr-6">
        <li v-for="(link, i) in navLinks" :key="link.text">
          <router-link :to="link.to" class="font-mono text-body-2 text-lightest-slate nav-link">
            <span class="text-primary">{{ String(i + 1).padStart(2, '0') }}.</span> {{ link.text }}
          </router-link>
        </li>
      </ul> -->

      <template #append>
        <template v-if="!isMobile">
          <v-btn
            icon="mdi-github"
            variant="text"
            href="https://github.com/robsmitha"
            target="_blank"
            aria-label="GitHub"
          ></v-btn>
          <v-btn
            icon="mdi-linkedin"
            variant="text"
            href="https://www.linkedin.com/in/robsmitha/"
            target="_blank"
            aria-label="LinkedIn"
          ></v-btn>
        </template>
        <v-btn v-if="!auth.signedIn" variant="outlined" color="white" href="/.auth/login/aad" class="ml-2">
          Sign In
        </v-btn>
        <v-menu
          v-model="menu"
          location="bottom"
        >
          <template v-slot:activator="{ props }">
            <v-avatar
              v-if="auth.signedIn"
              size="35"
              color="blue-darken-4"
              class="mx-2"
              v-bind="props"
              >
              <v-btn icon variant="text">
                <span class="text-h5 font-weight-bold">
                  {{ auth.userDetails?.charAt(0)?.toUpperCase() }}
                </span>
              </v-btn>
            </v-avatar>
          </template>

          <v-card min-width="300" color="surface">
            <v-list bg-color="surface">
              <v-list-item>
                <v-list-item-subtitle class="text-slate">
                  {{ auth.userDetails }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-divider color="lightest-navy"></v-divider>

            <v-list density="compact" bg-color="surface">
              <v-list-item prepend-icon="mdi-account-group" title="Users" to="/users"></v-list-item>
              <v-list-item prepend-icon="mdi-tag-multiple" title="Products" to="/products"></v-list-item>
              <v-list-item prepend-icon="mdi-bank" title="Accounts" to="/accounts"></v-list-item>
              <v-list-item prepend-icon="mdi-currency-usd" title="Spending" to="/spending"></v-list-item>
            </v-list>

            <v-divider color="lightest-navy"></v-divider>

            <v-card-actions>
              <v-btn block variant="outlined" color="primary" href="/.auth/logout">
                Logout
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </template>
    </v-app-bar>

    <v-navigation-drawer
        v-model="drawer"
        temporary
        location="left"
        color="surface"
    >
      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-home-roof" title="Home" value="home" to="/"></v-list-item>

        <v-list-item subtitle="Features"></v-list-item>
        <!-- <v-list-item prepend-icon="mdi-certificate-outline" title="Resume" value="about" href="https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/files/Rob+Smitha+Resume.pdf"></v-list-item> -->
        <v-list-item prepend-icon="mdi-magnify" title="Search Code" value="code" to="/code"></v-list-item>
        <v-list-item prepend-icon="mdi-rocket-launch-outline" title="Generate Code" value="generate-code" to="/generate-code"></v-list-item>
        <v-list-item prepend-icon="mdi-rss" title="Congress Feed" value="congress" to="/congress"></v-list-item>

        <v-list-item subtitle="External Links"></v-list-item>
        <v-list-item prepend-icon="mdi-github" title="GitHub" href="https://github.com/robsmitha" target="_blank"></v-list-item>
        <v-list-item prepend-icon="mdi-linkedin" title="LinkedIn" href="https://www.linkedin.com/in/robsmitha/" target="_blank"></v-list-item>
        <v-list-item prepend-icon="mdi-file-pdf-box" title="Resume" href="https://smitha-cdn.s3.us-east-2.amazonaws.com/Content/files/Rob+Smitha+Resume.pdf" target="_blank"></v-list-item>
        <!-- <v-list-item prepend-icon="mdi-desktop-classic" title="robsmitha.github.io" href="https://robsmitha.github.io/" target="_blank"></v-list-item> -->


        <!-- <template v-if="!auth.signedIn">
          <v-list-item subtitle="Sign in"></v-list-item>
          <v-list-item prepend-icon="mdi-github" title="Github" href="/.auth/login/github"></v-list-item>
          <v-list-item prepend-icon="mdi-microsoft" title="Microsoft" href="/.auth/login/aad"></v-list-item>
        </template> -->
        <!-- <template v-else>
          <v-list-item :subtitle="auth.userDetails"></v-list-item>
          <v-list-item prepend-icon="mdi-account-group" title="Users" to="/users"></v-list-item>
          <v-list-item prepend-icon="mdi-tag-multiple" title="Products" to="/products"></v-list-item>
          <v-list-item prepend-icon="mdi-currency-usd" title="Spending" to="/spending"></v-list-item>
          <v-list-item prepend-icon="mdi-bank" title="Accounts" to="/accounts"></v-list-item>
        </template> -->
      </v-list>
      <!-- <template v-slot:append>
        <div v-if="auth.signedIn" class="pa-2">
          <v-btn block color="blue-grey" href="/.auth/logout">
            Logout
          </v-btn>
        </div>
      </template> -->
    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useAppStore } from "@/store/app"
import { useAuthStore } from "@/store/auth"
import { useRoute, useRouter } from 'vue-router'
import { useGoTo } from 'vuetify'
import { useGithubStore } from "@/store/github"
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
const route = useRoute()
const router = useRouter()
const goTo = useGoTo()

const store = useAppStore()
//store.fetchContent()

const gitHubStore = useGithubStore()
gitHubStore.fetchRepos()

const auth = useAuthStore()
auth.fetchAuth()

const drawer = ref(false)
const transparency = ref(false)
const menu = ref(false)

const isMobile = computed(() => mobile.value)

// const navLinks = [
//   { text: 'Projects', to: { path: '/', hash: '#projects' } },
//   { text: 'Features', to: { path: '/', hash: '#features' } },
// ]

watch(route, (newVal) => {
    transparency.value = newVal.path === '/'
}, { immediate: true })

onMounted(() =>{
  window.addEventListener('scroll', () => {
    transparency.value = route.path === '/' && window.scrollY <= 75
  })
})

function onBrandClick(){
  if(route.path === '/'){
      goTo('#navTop', { duration: 300, easing: 'easeInCubic' })
  }
  else{
      router.push({ path: '/' })
  }
}
</script>

<style scoped>
:deep(.nav-solid) {
  background-color: rgb(var(--v-theme-background)) !important;
  border-bottom: 1px solid rgb(var(--v-theme-lightest-navy));
  box-shadow: 0 10px 30px -10px rgba(2, 12, 27, 0.5) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.nav-links {
  list-style: none;
}

.nav-link {
  text-decoration: none;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease, opacity 0.2s ease;
  opacity: 0.85;
}

.nav-link:hover {
  opacity: 1;
  border-color: rgb(var(--v-theme-primary));
}
</style>
