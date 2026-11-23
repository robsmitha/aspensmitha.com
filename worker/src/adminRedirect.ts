/**
 * The site used to be managed at /admin on this domain. That now happens in the shared admin app, so the old
 * addresses send people there: bookmarks, and links in emails already sent, keep working.
 *
 * No imports, so it can be tested on its own.
 */

/** This site in the admin app. clientapp/src/utils/adminApp.ts holds the same address for the footer link. */
export const ADMIN_URL = 'https://manage.smithadigital.com/s/aspensmitha'

/** Old pages whose new address isn't simply the same words */
const MOVED: Record<string, string> = {
  '/admin': '',
  '/admin/photos': '/photos',
  '/admin/stories': '/stories',
  '/admin/instagram': '/integrations?open=instagram',
  '/admin/calendar': '/integrations?open=calendar',
  '/products': '/sessions',
  '/users': '/people',
}

/** A story's editor: /admin/stories/{id}. The id is a GUID; anything else is not passed on. */
const STORY = /^\/admin\/stories\/([0-9a-f-]{1,64})$/i

/**
 * Where an old management address now lives, or null when the path was never one of them.
 * The old sign-in pages go to the admin app's front door, which asks the person to sign in.
 */
export function adminRedirect(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (path in MOVED) {
    return ADMIN_URL + MOVED[path]
  }

  const story = STORY.exec(path)
  if (story) {
    return `${ADMIN_URL}/stories/${story[1]}`
  }

  if (path.startsWith('/admin/') || path === '/auth' || path.startsWith('/auth/')) {
    return ADMIN_URL
  }
  return null
}
