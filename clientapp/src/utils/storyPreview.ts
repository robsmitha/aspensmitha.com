/**
 * Draft previews. The admin app opens a story's page with "#preview=<token>": a short-lived token from the
 * backend that opens that one story in any status. The part after "#" is never sent to a server.
 *
 * The router takes the token out of the address as soon as it sees it (so it isn't left in the address bar,
 * in history, or in what analytics records) and it is kept here for this tab, so a refresh still previews.
 *
 * No `@/` imports: kept free-standing so it can move to the shared UI library with the story components.
 */

/** The preview token in a page address's "#" part (location.hash), or null */
export function previewTokenFrom(hash: string): string | null {
  const match = /^#preview=([^&]+)$/.exec(hash)
  if (!match) return null
  try {
    return decodeURIComponent(match[1]) || null
  } catch {
    return null
  }
}

const KEY = 'story-preview:'

// Used when sessionStorage is unavailable (private windows, blocked storage): the preview then lasts until a refresh
const memory = new Map<string, string>()

export function rememberPreviewToken(path: string, token: string) {
  memory.set(path, token)
  try {
    sessionStorage.setItem(KEY + path, token)
  } catch { /* the in-memory copy still works */ }
}

/** The token this tab was given for the page at this path, or null */
export function previewTokenFor(path: string): string | null {
  try {
    return sessionStorage.getItem(KEY + path) ?? memory.get(path) ?? null
  } catch {
    return memory.get(path) ?? null
  }
}

/** Called when a token no longer works, so the page goes back to showing what the public sees */
export function forgetPreviewToken(path: string) {
  memory.delete(path)
  try {
    sessionStorage.removeItem(KEY + path)
  } catch { /* nothing stored */ }
}
