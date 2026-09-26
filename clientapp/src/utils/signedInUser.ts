import { computed, ref } from 'vue'
import apiClient from '@/api/elysianClient'
import type { ClaimsIdentity } from '@/store/types'

/** Sends Aspen straight to the photo manager after signing in */
export const SIGN_IN_URL = '/.auth/login/aad?post_login_redirect_uri=/admin/photos'
export const SIGN_OUT_URL = '/.auth/logout?post_logout_redirect_uri=/'
export const ADMIN_HOME = '/admin/photos'

/** undefined while unknown, null when signed out */
const userDetails = ref<string | null | undefined>()
let loading: Promise<void> | undefined

/**
 * The Static Web Apps signed-in user, fetched once per page load and shared
 * by the public header/footer and the admin bar.
 */
export function useSignedInUser() {
  loading ??= (async () => {
    const response = await apiClient.getData('/.auth/me')
    userDetails.value = response.success
      ? (response.data as ClaimsIdentity)?.clientPrincipal?.userDetails ?? null
      : null
  })()

  return {
    userDetails,
    signedIn: computed(() => !!userDetails.value),
  }
}
