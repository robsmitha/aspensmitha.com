# Phase 4: the shared admin app

Status: decisions agreed 2026-11-22. Nothing here is built yet. Parent plan: `elysian-sites-platform.md`.

## Goal

Aspen manages her site from `manage.smithadigital.com`. The app is one codebase for every tenant, lives in
`elysian-platform/admin`, and has a site picker and invite codes. Her current admin pages at
`www.aspensmitha.com/admin` keep working until the new app is proven, then are removed.

## What exists today

**Backend, already deployed (Elysian 0.0.63 on `elysian-sites`):**

- `GET /api/platform/my-sites`: the tenants the signed-in user can manage, each with platform, runtime and role.
- `POST /api/platform/invites/redeem`: redeem an invite code.
- `/api/manage/members` and `/api/manage/invites`: list, create and remove, per tenant.
- Platform-admin functions: create a tenant, set its status and modules, create and rotate edge clients.
- An edge client with `admin` scope may name any tenant in `X-Tenant`, and is the only kind that can reach
  the platform functions. Roles then come from the user's membership in that tenant.

**Frontend, in `aspensmitha.com/clientapp` (about 4,100 lines of admin code):**

| Part | Lines | Notes |
|---|---|---|
| `components/Admin/PhotoManager.vue` | 1,420 | Upload, edit, crops, placements, delete |
| `pages/admin.stories.[id].vue`, `admin.stories.vue` | 1,005 | Story editor, previews with the public `StoryHero` |
| `pages/admin.photos.vue`, `admin.instagram.vue`, `admin.calendar.vue` | 717 | |
| `PlacementMap.vue`, `CoverPhotoPicker.vue`, `PlacementPublishStatus.vue`, header | 465 | |
| `layouts/admin*`, `auth/index.ts`, auth pages | about 500 | MSAL sign-in, already on Entra External ID |

**What ties that code to Aspen's site.** The admin code imports site data that is compiled into her build:

- `utils/portfolioCategories.ts`: her photo categories and their copy.
- `utils/sitePlacements.ts`: the list of featured spots, with labels and which page each is on.
- `content/placementSlots.json`: each spot's ratio and widths. A copy is embedded in the shared host, where
  it applies to every tenant.
- `PlacementMap.vue`: a hand-drawn diagram of her page layouts.
- The `aspen` theme and the `aspensmitha.com` wordmark.

A shared app can't compile any of that in. It has to ask the backend for it, per tenant.

## Decisions

### 1. Two homes for frontend code: the admin app and a shared UI library

- **`elysian-platform/admin`** holds the management screens: photo manager, story editor, Instagram and
  calendar admin, site picker, members and invites. Every tenant signs in to this one app, so these screens
  have one consumer however many customers there are.
- **`elysian-platform/packages/ui`** is a shared library for what sites show the public. Custom-built sites
  and the shared tenant platform site both use it, so a fix is made once.

| In the shared library | In the admin app |
|---|---|
| API client and the sign-in module | Photo manager, story editor |
| Photo address and placement image helpers | Instagram and calendar admin pages |
| `ResponsivePhoto` and the placement `<img>` component | Site picker, members, invites |
| Contact form and booking components (Turnstile included) | The placement map renderer |
| Story display components | |

The admin app also uses the library, so the story editor's preview and the public story page are the same
code and can't drift apart.

How the library works:

- It ships Vue source files; each site compiles them with its own Vite build.
- It is published to GitHub Packages on a tag, the same way as `site-edge`. Inside `elysian-platform` the
  admin app and the templates use it directly as a workspace package.
- Components take colours and fonts from the site's Vuetify theme, so each site keeps its own look.
- The placement image helper stays free of framework imports and `import.meta.env`, because a site's Vite
  config imports it to preload the hero image.

Aspen's live site moves onto the library after the 14-day watch, a few components at a time, with LCP
checked each time. Until then her copies of those components stay as they are. Her old `/admin` pages are
frozen except for outright breakage, then deleted when the new app is proven.

### 2. Site data flows one way, at deploy time

The public site never calls the backend for its own structure. Page load does not change.

1. **The site's repo is the source of truth.** Categories, spots, slot sizes and page layouts stay compiled
   into the site's build. Pages know every image address and size with no API call, and images come straight
   from Cloudflare's cache.
2. **The build also writes the same data to a static file,** `/_site/manifest.json`, served from the Worker's
   static assets. This replaces the plan's `/_site/placement-slots.json`.
3. **After a deploy, Elysian reads that file once and stores it per tenant.** It fetches from the tenant's
   stored primary address, never from an address in the request.
4. **Only two things read the stored copy:** the admin app, through `GET /api/manage/site`, and the
   background job that publishes placement images. Neither is on a visitor's page load.

The manifest holds:

- name, platform, public address and image base address
- enabled modules, which decide the admin navigation
- photo categories (slug, name, whether they hold stories)
- featured spots (key, label, page, ratio, widths, public name)
- each page's layout for the placement map (decision 3)

Guards, because the publisher serves live home page images:

- Elysian rejects a manifest that drops or renames an existing slot's public name unless told to explicitly.
- The publisher never deletes a published image because a slot disappeared.
- A publish never starts from an empty catalogue. A tenant with no stored manifest is not published at all.

The admin app fetches the manifest alongside the photo list when a site is opened, and keeps the last copy in
the browser so the screen draws at once and refreshes in the background.

Phase 4 seeds Aspen's manifest with a SQL script. The deploy hook (step 3 above) replaces the script in
Phase 5. This needs Elysian 0.0.64: manifest storage, the query, and the placement catalogue read per tenant
instead of from one file embedded in the host.

### 3. The placement map stays, drawn from data

`PlacementMap.vue` is a small wireframe built from a handful of block types: a text line, a row, a column, a
photo spot with a ratio, a banner, a grid, and filler for forms and fact tiles.

- The manifest carries each page's layout as a short list of those blocks. A photo block names its spot.
- The admin app has one generic renderer that draws any site's map from that list and highlights the
  selected spot.
- Aspen's current map is converted to that data in her repo, next to her list of spots.

The layout is optional. A site with none gets a list of spots grouped by page, each drawn at its ratio. A
layout that rows, columns and grids can't express needs a new block type in the renderer.

### 4. The site is in the URL, and the admin Worker turns it into the tenant

- Pages are `/s/{tenant}/photos`, `/s/{tenant}/stories` and so on. `/` is the site picker. A user with one
  site skips the picker.
- The app sends the tenant from the URL in an `X-Site` request header. The admin Worker copies it to
  `X-Tenant` and adds its `admin`-scope credential. The Worker strips any `X-Tenant` the browser sent.
- Requests under `/api/platform/` are forwarded with no tenant.
- The backend decides access from the user's membership on every request. The header is only a request to
  act in that site, never proof of the right to.

Links can be shared, two tabs can hold two sites, and there is no stored "current site" to go stale. This
needs `@robsmitha/site-edge` 0.2.0: an admin Worker mode, since today's forwarder refuses to send a request
without a tenant.

### 5. Platform administration waits for Phase 5

In Phase 4: sign-in, site picker, redeeming an invite, members and invites for a site, and Aspen's four admin
areas. Screens to create tenants, set modules and manage edge clients come with Phase 5; until then those
stay as SQL scripts and API calls.

### 6. One neutral admin theme

The site's name goes in the header. A per-platform theme is built when a second platform arrives.

## Sign-in

No new sign-in work. The app uses the same Entra External ID app registration and the MSAL module written in
Phase 2, moved into the shared library. It needs one more redirect URI,
`https://manage.smithadigital.com/auth/callback`.

Sessions for the admin app live only on `manage.smithadigital.com`, a different registrable domain from every
tenant site, which is what the plan's review asked for.

## Build order

| Step | Work | Where | Needs from you |
|---|---|---|---|
| 1 | Site manifest: storage, query, per-tenant placement catalogue, guards, tests | Elysian | Merge and tag 0.0.64 |
| 2 | Admin Worker mode in the edge package | `elysian-platform/packages/site-edge` | Tag `site-edge-v0.2.0` |
| 3 | Shared UI library: API client, sign-in, photo and placement helpers, story display | `elysian-platform/packages/ui` | Tag its first release |
| 4 | `GET /api/manage/site` in the host, bump to 0.0.64; Aspen's manifest (with map layouts) as a SQL seed | `elysian-platform`, SQL script | Run the script |
| 5 | App shell: sign-in, site picker, redeem invite, members and invites | `elysian-platform/admin` | Admin edge client (SQL), approve a new Worker on `workers.dev` |
| 6 | Move the four admin areas, reading site data from the manifest; map renderer | `elysian-platform/admin` | Test on the `workers.dev` address |
| 7 | Attach `manage.smithadigital.com`; add the redirect URI | Cloudflare, Entra | Approve the domain, add the URI |
| 8 | Aspen uses it for a week; then delete `/admin` from her site and redirect | `aspensmitha.com` | Your call on when |
| 9 | Contact and booking components into the library; Aspen's site moves onto the library | `packages/ui`, `aspensmitha.com` | After the 14-day watch |

Steps 1, 2 and 3 are independent and can go in parallel. Nothing before step 8 changes
`www.aspensmitha.com`.

## Risks and open questions

- **Platform-admin audit log.** The plan says platform-admin access to a tenant is written to an audit log.
  Not yet checked whether Elysian does this. If not, it belongs in step 1.
- **Public address per tenant.** The manifest needs each tenant's primary address for the "view site" link
  and for image addresses. Elysian has no tenant domain table yet. For Phase 4 the seeded manifest holds the
  address as plain data; the domain model comes with Phase 5.
- **Legacy pages.** `users.vue` and `products.vue` use the admin layout but are not part of the photography
  admin. They are left behind and deleted with the old pages.
- **Per-tenant catalogue is the largest piece.** It touches publishing, which serves the live home page
  images. Fixed addresses must never 404, and the guards in decision 2 need tests before release.
- **Library changes reach every site.** A breaking change in `packages/ui` affects each site at its next
  upgrade. Sites pin a version and upgrade on purpose.
