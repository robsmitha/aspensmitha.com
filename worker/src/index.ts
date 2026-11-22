import { createSiteWorker } from '@robsmitha/site-edge'

// This Worker serves one tenant, and says so itself. The browser never chooses.
const site = createSiteWorker({ tenant: 'aspensmitha' })

// Paths that are files, never app routes. When one is missing the answer is a 404, not the app's page:
// a browser asking for last week's script after a deploy must not be handed HTML to cache as that script.
const FILE_PATHS = /^\/(assets\/|favicon\.)/

type Env = Parameters<typeof site.fetch>[1]

const notFound = () =>
  new Response('Not found.', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
  })

// Files that exist, prerendered pages and the old-address redirects are answered by static assets and never
// reach this code. What does reach it: /api/*, and any path with no file behind it.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/')) {
      return site.fetch(request, env)
    }

    const isRead = request.method === 'GET' || request.method === 'HEAD'
    if (!env.ASSETS || !isRead || FILE_PATHS.test(pathname)) {
      return notFound()
    }

    // An app route (a story, an admin page): serve the app and let it route
    return env.ASSETS.fetch(new Request(new URL('/', request.url), { method: request.method, headers: request.headers }))
  },
}
