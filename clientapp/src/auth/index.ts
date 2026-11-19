/**
 * Who is signed in, and how they sign in.
 *
 * Two modes, chosen when the site is built (VITE_AUTH_MODE):
 *
 *  - "swa" (the default): Azure Static Web Apps signs people in at /.auth/* and identifies them to the API
 *    itself. This is how the live site works.
 *  - "external": the site is served by a Cloudflare Worker. People sign in with Microsoft Entra External ID
 *    and the browser sends the resulting token to the API on every call.
 *
 * Everything the rest of the app needs is behind the functions exported here, so nothing else knows which
 * mode it is in.
 *
 * The sign-in library is large and only signed-in people need it, so it is loaded on demand. A visitor who
 * has never signed in never downloads it: that is decided from a one-character flag in localStorage, without
 * loading anything.
 */

export const AUTH_MODE: 'swa' | 'external' = import.meta.env.VITE_AUTH_MODE === 'external' ? 'external' : 'swa'

/** Where an owner lands after signing in */
export const ADMIN_HOME = '/admin/photos'

/** Pages only a signed-in person may open. In "swa" mode staticwebapp.config.json enforces the same list. */
const SIGNED_IN_PATHS = ['/admin', '/users', '/products']

export const requiresSignIn = (path: string) =>
  SIGNED_IN_PATHS.some(prefix => path === prefix || path.startsWith(`${prefix}/`))

/** Links, so they work as plain hrefs in both modes */
export const SIGN_IN_URL = AUTH_MODE === 'external'
  ? `/auth/sign-in?returnTo=${encodeURIComponent(ADMIN_HOME)}`
  : `/.auth/login/aad?post_login_redirect_uri=${ADMIN_HOME}`

export const SIGN_OUT_URL = AUTH_MODE === 'external'
  ? '/auth/sign-out'
  : '/.auth/logout?post_logout_redirect_uri=/'

/** Only ever a path on this site, so a crafted link can't send someone elsewhere after signing in */
export function safeReturnTo(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/auth/')
    ? value
    : ADMIN_HOME
}

// ---- "external" mode ------------------------------------------------------------------------------------

const HINT_KEY = 'signed-in'

/** True when this browser has signed in before and not signed out. Says nothing about whether it's still valid. */
function hasSignedInHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

function setSignedInHint(signedIn: boolean) {
  try {
    if (signedIn) localStorage.setItem(HINT_KEY, '1')
    else localStorage.removeItem(HINT_KEY)
  } catch { /* storage unavailable: the person simply signs in each visit */ }
}

type Msal = typeof import('@azure/msal-browser')
type Client = { msal: Msal, app: import('@azure/msal-browser').IPublicClientApplication, returnTo?: string }

const scopes = () => [import.meta.env.VITE_AUTH_SCOPE as string]

let client: Promise<Client> | undefined

/** Loads the sign-in library once, and finishes a sign-in if this page load is the return from one */
function getClient(): Promise<Client> {
  client ??= (async () => {
    const msal = await import('@azure/msal-browser')
    const authority = import.meta.env.VITE_AUTH_AUTHORITY as string

    const app = new msal.PublicClientApplication({
      auth: {
        clientId: import.meta.env.VITE_AUTH_CLIENT_ID as string,
        authority,
        knownAuthorities: [new URL(authority).host],
        redirectUri: `${window.location.origin}/auth/callback`,
        postLogoutRedirectUri: `${window.location.origin}/`,
      },
      // Shared across tabs, so opening the admin in a second tab doesn't ask to sign in again
      cache: { cacheLocation: 'localStorage' },
    })
    await app.initialize()

    // By default the library, on return from signing in, navigates back to the page that started it. Here that
    // page is /auth/sign-in, which would start signing in again, forever. The callback page decides where to go.
    const result = await app.handleRedirectPromise({ navigateToLoginRequestUrl: false })
    if (result?.account) {
      app.setActiveAccount(result.account)
      setSignedInHint(true)
    } else if (!app.getActiveAccount()) {
      app.setActiveAccount(app.getAllAccounts()[0] ?? null)
    }

    return { msal, app, returnTo: result?.state }
  })()

  // A failed load (offline, blocked script) shouldn't be remembered for the rest of the visit
  client.catch(() => { client = undefined })
  return client
}

async function externalUser(): Promise<string | null> {
  if (!hasSignedInHint() && !window.location.pathname.startsWith('/auth/callback')) {
    return null
  }

  try {
    const { app } = await getClient()
    const account = app.getActiveAccount()
    setSignedInHint(!!account)
    return account ? account.username || account.name || 'Signed in' : null
  } catch (error) {
    console.error('Could not check sign-in', error)
    return null
  }
}

async function externalToken(): Promise<string | null> {
  if (!hasSignedInHint()) {
    return null
  }

  try {
    const { app, msal } = await getClient()
    const account = app.getActiveAccount()
    if (!account) {
      setSignedInHint(false)
      return null
    }

    try {
      return (await app.acquireTokenSilent({ scopes: scopes(), account })).accessToken
    } catch (error) {
      if (error instanceof msal.InteractionRequiredAuthError) {
        // The session has run out. The API answers 401 and the page guard sends them to sign in again.
        setSignedInHint(false)
        return null
      }
      throw error
    }
  } catch (error) {
    console.error('Could not get a sign-in token', error)
    return null
  }
}

// ---- "swa" mode -----------------------------------------------------------------------------------------

async function swaUser(): Promise<string | null> {
  try {
    const response = await fetch('/.auth/me')
    if (!response.ok) {
      return null
    }
    const identity = await response.json()
    return identity?.clientPrincipal?.userDetails ?? null
  } catch {
    return null
  }
}

// ---- What the app uses ----------------------------------------------------------------------------------

let user: Promise<string | null> | undefined

/** The signed-in person's name or email, or null. Looked up once per page load. */
export function currentUser(): Promise<string | null> {
  user ??= AUTH_MODE === 'external' ? externalUser() : swaUser()
  return user
}

/**
 * The token to send to the API, or null when there is none to send: nobody is signed in, or the site is in
 * "swa" mode where Static Web Apps identifies the person itself.
 */
export function accessToken(): Promise<string | null> {
  return AUTH_MODE === 'external' ? externalToken() : Promise.resolve(null)
}

/** Leaves the site for the sign-in page, and comes back to returnTo afterwards */
export async function signIn(returnTo: string = ADMIN_HOME): Promise<void> {
  if (AUTH_MODE !== 'external') {
    window.location.assign(`/.auth/login/aad?post_login_redirect_uri=${safeReturnTo(returnTo)}`)
    return
  }

  const request = { scopes: scopes(), state: safeReturnTo(returnTo) }
  try {
    const { app } = await getClient()
    await app.loginRedirect(request)
  } catch (error) {
    if ((error as { errorCode?: string })?.errorCode !== 'interaction_in_progress') {
      throw error
    }

    // An earlier sign-in in this tab was abandoned partway (the tab was closed or navigated away), and the
    // library still thinks it is under way. Nothing can be in flight now, so forget it and start again.
    clearAbandonedSignIn()
    client = undefined
    const { app } = await getClient()
    await app.loginRedirect(request)
  }
}

/** The library keeps a sign-in's working state in this tab's sessionStorage, under keys starting "msal." */
function clearAbandonedSignIn() {
  try {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('msal.'))
      .forEach(key => sessionStorage.removeItem(key))
  } catch { /* storage unavailable: there is nothing to clear */ }
}

export async function signOut(): Promise<void> {
  if (AUTH_MODE !== 'external') {
    window.location.assign(SIGN_OUT_URL)
    return
  }

  setSignedInHint(false)
  const { app } = await getClient()
  await app.logoutRedirect({ account: app.getActiveAccount() })
}

/**
 * For /auth/callback: finishes the sign-in this page load is the return from, and says where the person
 * was trying to go. Null when nobody ended up signed in.
 */
export async function completeSignIn(): Promise<string | null> {
  if (AUTH_MODE !== 'external') {
    return ADMIN_HOME
  }

  const { app, returnTo } = await getClient()
  return app.getActiveAccount() ? safeReturnTo(returnTo) : null
}
