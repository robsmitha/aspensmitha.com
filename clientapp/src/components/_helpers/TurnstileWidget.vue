<template>
  <div ref="container" class="turnstile-widget" :class="{ 'turnstile-widget--interactive': interactive }"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type TurnstileRenderOptions = {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  appearance?: 'always' | 'execute' | 'interaction-only'
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  'timeout-callback'?: () => void
  'before-interactive-callback'?: () => void
  'after-interactive-callback'?: () => void
}

type Turnstile = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Loaded once per page, shared by every widget instance
let scriptLoading: Promise<Turnstile> | null = null

function loadTurnstile(): Promise<Turnstile> {
  scriptLoading ??= new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile)
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile failed to initialize'))
    script.onerror = () => {
      scriptLoading = null
      reject(new Error('Turnstile script failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptLoading
}

const props = defineProps<{
  siteKey: string
}>()

const emit = defineEmits<{
  (e: 'verified', token: string): void
  /** The current token can no longer be used (expired, errored, or the widget was reset) */
  (e: 'expired'): void
  (e: 'error'): void
  /** Cloudflare needs the visitor to click the checkbox, so the widget is now visible */
  (e: 'interactive', visible: boolean): void
}>()

const container = ref<HTMLElement>()
const interactive = ref(false)
let widgetId: string | null = null
let unmounted = false

onMounted(async () => {
  try {
    const turnstile = await loadTurnstile()
    if (unmounted || !container.value) return
    widgetId = turnstile.render(container.value, {
      sitekey: props.siteKey,
      theme: 'light',
      // Stays invisible while the check runs in the background; only shows up if a click is needed
      appearance: 'interaction-only',
      size: 'flexible',
      callback: token => emit('verified', token),
      'expired-callback': () => emit('expired'),
      'timeout-callback': () => emit('expired'),
      'error-callback': () => emit('error'),
      'before-interactive-callback': () => setInteractive(true),
      'after-interactive-callback': () => setInteractive(false),
    })
  } catch (error) {
    console.error(error)
    emit('error')
  }
})

onBeforeUnmount(() => {
  unmounted = true
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId)
    widgetId = null
  }
})

function setInteractive(visible: boolean) {
  interactive.value = visible
  emit('interactive', visible)
}

/** Discards the current token and runs a fresh challenge (tokens are single use) */
function reset() {
  emit('expired')
  if (widgetId && window.turnstile) {
    window.turnstile.reset(widgetId)
  }
}

defineExpose({ reset })
</script>

<style scoped>
.turnstile-widget--interactive {
  margin-bottom: 1.5rem;
}
</style>
