import { computed, ref } from 'vue'
import { ADMIN_HOME, SIGN_IN_URL, SIGN_OUT_URL, currentUser } from '@/auth'

/** Sign-in sends Aspen straight to the photo manager */
export { ADMIN_HOME, SIGN_IN_URL, SIGN_OUT_URL }

/** undefined while unknown, null when signed out */
const userDetails = ref<string | null | undefined>()
let loading: Promise<void> | undefined

/**
 * The signed-in user, looked up once per page load and shared by the public header/footer and the admin bar.
 * How they signed in is src/auth's business.
 */
export function useSignedInUser() {
  loading ??= currentUser().then(user => { userDetails.value = user })

  return {
    userDetails,
    signedIn: computed(() => !!userDetails.value),
  }
}
