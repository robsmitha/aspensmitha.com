# Plan: Landing and Portfolio placement images served straight from Cloudflare

Status: **recommendations accepted (2026-10-20), implemented on branch `feature/placement-images`**. Section 13 covers what was built and the rollout runbook. §12 lists what I couldn't check from here.

---

## 0. Decisions for you

Each decision has a recommendation. Fill in the last column, or leave it blank to accept the recommendation.

| # | Decision | Options | Recommendation | Your answer |
|---|---|---|---|---|
| D1 | **Which images are in scope?** The code doesn't link placements to the "Site only" category (see §1). | **a.** Every slot shown on Home and `/portfolio`, whatever the photo's category. **b.** Only photos in the "Site only" category. | **a.** The URL belongs to the *slot*. With b, a wedding photo in the hero strip would still go through the API, and the goal fails. | |
| D2 | **Empty slots** (a 404 isn't allowed) | **a.** Never empty: each slot falls back through a chain (§3.3) ending at a *site default* image that the admin picks with a new `site-default` placement, or a neutral ivory image if none is picked. Admin page flags slots that are showing a fallback. **b.** The hero strip compacts: filled photos are rewritten into positions 1…k and the rest repeat. **c.** A small `meta.json` tells the frontend how many hero photos there are, and it trims the rest. | **a.** No extra request, no 404s. It covers deletions automatically. | |
| D3 | **Alt text** (no DB means the admin-entered alt isn't available at render time) | **a.** Fixed alt per slot, defined in the slot catalogue, e.g. "Wedding photography by Aspen Smitha". **b.** Publish a `meta.json` with the admin's alt text; the frontend fetches it without blocking (needs a CORS header rule). | **a** for v1 (no runtime dependencies, no CORS). Move to **b** later if you want the admin's own wording. | |
| D4 | **Cache tier 2: how to set the edge vs. browser TTL** | **a.** Header only: `public, max-age=300, s-maxage=…`. **b.** A second Cache Rule for `/placements/` with an Edge TTL override and a Browser TTL override. | **b.** See §5.2: option a depends on the zone-wide Browser Cache TTL setting, which can silently stretch 5 minutes to hours. | |
| D5 | **Edge TTL for `/placements/`** | 1 year / 30 days | **30 days.** On a low-traffic site, edge eviction happens well before 30 days, so the hit ratio barely changes. It limits how long a missed purge can serve a stale image to 30 days instead of a year. | |
| D6 | **Browser TTL for `/placements/`** | 1 / 5 / 15 min | **5 min** (300 s) | |
| D7 | **JPEG fallback** | Yes / No | **No.** WebP works in every browser released since about 2020. A JPEG copy doubles the files and purge list for well under 3% of visitors, who would still get a working image if we kept a single JPEG for `og:image` only. | |
| D8 | **AVIF** | Drop / add a native encoder | **Drop for now** (§3.5). ImageSharp 3.1.12 can't encode AVIF. | |
| D9 | **Source for the cropped variants** | **a.** The uploaded original (`photo-originals`). **b.** The existing `photos/…/v{n}/2400.webp`. | **a.** Best quality. Decoding is slower, but it runs in the background. | |
| D10 | **Where the publisher code lives** | **a.** This repo (`server/`). **b.** The shared Elysian NuGet package. | **a.** The slots are specific to this site. Everything it needs is already public in Elysian (`ElysianContext`, `IPhotoStorage`, ImageSharp), so the package doesn't need a new version. | |
| D11 | **Hero preload location** | **a.** Static tags in the head of the built `index.html` for `/` only (emitted through `seo.ts`). **b.** Plain static tags in the `index.html` template. | **a.** The `seoPages` Vite plugin copies `index.html` to *every* page (`contact.html`, `portfolio/weddings.html`, …). With b, every page would preload hero images it never shows. The preconnect goes on every page. | |
| D12 | **Include the `home-recent-*` slots?** They're defined, but `pages/index.vue` doesn't render `Landing/Portfolio.vue`. | Yes / No | **No.** Reserve the names and add them when the section goes back on the page. | |
| D13 | **Include the About/Contact slots now** (`about-story`, `about-cta`, `contact-portrait`)? | Yes / No | **No.** Out of the stated scope, but the design supports them with only catalogue entries. Easy follow-up. | |
| D14 | **Reading originals: credentials** | **a.** Keep the existing connection string (current code path). **b.** Managed identity with *Storage Blob Data Reader* on `photo-originals`. | **a** for v1. The connection string is already on the Function for uploads; b is a later tidy-up. Writes to `placements` use managed identity in either case. | |
| D15 | **Unrelated finding:** `clientapp/src/utils/seo.ts:17` (`SITE_URL`), `index.html` (og:image, JSON-LD) and `public/robots.txt` still use `https://www.aspensmitha.com`. Canonical URLs and the sitemap point at a different domain from the live site. | Fix in a separate PR / leave | **Separate PR, soon.** Canonicals pointing at another host hurt SEO. | |

---

## 1. How placements and "Site only" work today

| What | Where | Detail |
|---|---|---|
| **Slot catalogue** | `clientapp/src/utils/sitePlacements.ts` | `SITE_PLACEMENTS` is the list of every slot: `key`, `page`, `area`, `label`. Keys are stored in the DB and must never change. The hero has `HERO_SHOWCASE_COUNT = 8` slots (`home-hero-1…8`). Covers are `portfolio-cover-{slug}` for every `PORTFOLIO_CATEGORIES` entry. |
| **"Site only"** | `clientapp/src/utils/portfolioCategories.ts:73` | `SITE_ONLY_CATEGORY = { slug: 'site' }` is **a category, not a kind of placement**. It keeps photos out of galleries and category tiles. **Any photo in any category can fill any slot.** |
| **Admin UI** | `clientapp/src/pages/admin.photos.vue` | The "Featured on the site" multi-select (`:272-311`) edits `draft.placements`. `save()` (`:852`) posts to `/api/manage/photos/update` with the full set of slots. The UI warns "Currently X; choosing this replaces it" (`:307`). The "Site only" collection appears in the sidebar group "Site" (`:541`). |
| **Aspect ratio in the admin** | `admin.photos.vue:559` (`CROP_PREVIEWS`) | **The admin never stores a ratio per slot.** It stores a focal point only (`focusX/focusY`, 0..1). Ratios are hard-coded in each component's `aspect-ratio` prop and applied by CSS `cover` + `object-position`. The crop previews show 0.8 / 1.333 / 2, which **don't match** the hero's 0.75 or the CTA's 2.2. |
| **Write path** | Elysian `Application/Features/Photos/Commands/UpdatePhotoCommand.cs` → `PlacementAssignments.SetSpotsForPhotoAsync` | Makes the given keys the photo's complete set. A key another photo held moves to this one (one photo per slot). `SetPlacementCommand` sets or clears one slot. `DeletePhotoCommand` clears the photo's slots. |
| **Storage of slots** | Elysian `Domain/Data/Placement.cs` | One row per slot (`Key`, `PhotoId`). Unique per tenant, soft-deleted. |
| **Image variants** | Elysian `ProcessPhotoCommand.cs`, `ImageSharpPhotoProcessor.cs`, `AzurePhotoStorage.cs`, `PhotoPaths.cs` | ImageSharp 3.1.12 produces WebP (q82) at 400/800/1200/1600/2400, written to `photos/{tenant}/{photoId}/v{n}/{w}.webp` with `public, max-age=31536000, immutable`. A reprocess bumps `v{n}`. **Variants aren't cropped**; cropping is CSS only. |
| **Public read** | `server/PhotoFunctions.cs:30`, `server/Services/PortfolioCache.cs`, Elysian `GetPortfolioQuery.cs` | `GET /api/portfolio` returns every **Ready** photo with its `placements[]`, `srcBase`, `widths` and `focusX/Y`. In-memory cache for 5 min; response header `public, max-age=300, stale-while-revalidate=86400`. |
| **Frontend read** | `clientapp/src/layouts/landing.vue:19`, `clientapp/src/store/photos.ts` | The layout calls `usePhotoStore().load()`. Components call `forPlacement(key)` (`undefined` until loaded) or `coverFor(slug)`. `coverFor` uses the explicit cover, **else the category's first photo by sort order**. |
| **Consumers on the two in-scope pages** | `Landing/Hero.vue`, `Intro.vue`, `Specialties.vue`, `CallToAction.vue`; `Portfolio/CategoryTiles.vue` | All render `ResponsivePhoto` (`v-img`, lazy unless `eager`). The hero drops empty slots after load (`Hero.vue:129`) and loads slides 1–3 eagerly. |
| **Change points** | `server/PhotoFunctions.cs` | Every write (update, reorder, delete, set placement, reprocess, `ProcessPhoto` blob trigger) already calls `portfolioCache.Invalidate()`. **These are exactly the places the publish must be triggered from.** |

**Ambiguities found in the code:**
1. "Site only images that have a placement": placements aren't limited to the Site-only category (D1).
2. Cover fallback: a category's cover can change without anyone touching placements, through reorder, upload/processing, delete or re-categorising. So all of those must trigger a publish, which they do via the change points above.
3. Slots holding a photo that isn't **Ready** (Uploaded/Processing/Failed) show nothing today, because `GetPortfolioQuery` filters on Ready. The publisher treats them as empty until processing finishes, then publishes.
4. `home-recent-*` slots exist in the catalogue and admin, but not on the live page (D12).
5. The hero's eager slides (`i < 3`) may not be the ones visible at load. Embla `loop` + `align: 'center'` puts slide 1 in the centre, with slide **8** peeking in on the left, not slide 3. Verify in the browser; the preload follows the answer.
6. The CTA has `aspect-ratio="2.2"` but also `min-height: 400px` (`CallToAction.vue:45`). On a 375 px phone it renders about 880×400 CSS px, so `sizes="100vw"` makes phones download an image that's too small. Fixed in §7.
7. The tenant middleware (`server/Middleware/MuliTenantFunctionsWorkerMiddleware.cs`) already handles triggers that have no HTTP request: a `{tenant}` binding value first, then the `TenantIdentifier` app setting. **A queue trigger needs no middleware change** as long as the message carries `tenant`.

---

## 2. Request flow

### Before (first visit)
```
1. GET www…/            → Static Web App (Cache-Control: no-cache)           HTML
2. GET /assets/*.js     → Static Web App                                      JS bundle
3. Vue mounts → landing.vue → GET /api/portfolio
       → SWA linked backend → Function App (cold start possible)
       → PortfolioCache (in-memory, per instance) or SQL
       ← JSON: every Ready photo + placements + srcBase
4. Components render v-img → IntersectionObserver → GET images.…/photos/aspensmitha/{id}/v{n}/{w}.webp
```
No image request can start until step 3 finishes. That's the 5–7 s.

### After
```
1. GET www…/  → SWA. <head> has:
      <link rel="preconnect" href="https://images.aspensmithaphotography.com">
      <link rel="preload" as="image" imagesrcset="…/home-hero-strip-photo1-480.webp 480w, …" imagesizes="…" fetchpriority="high">
   → the browser fetches the hero images from the Cloudflare edge WHILE PARSING HTML
2. GET /assets/*.js (in parallel)
3. Vue renders <img src/srcset> using the same fixed URLs (already downloading or cached)
   Other slots (intro, specialties, CTA, covers) are requested as soon as they render. No API, no DB.
```
- **Cache hit:** browser → nearest Cloudflare data center → image.
- **Cache miss:** lower-tier data center → upper-tier data center (Smart Tiered Cache) → only on an upper-tier miss → Azure Blob `placements` container.
- `/api/portfolio` is still used on gallery pages, About, Contact and booking. Requirement 5: unchanged.

---

## 3. Reserved naming scheme

### 3.1 Format
```
https://images.aspensmithaphotography.com/placements/aspensmitha/{page}-{slot}-photo{index}-{width}.webp
```
- `{page}`: `home` or `portfolio`.
- `{slot}`: a fixed slot name. Named slots (`specialty-weddings`, `cover-couples`) are tied to their category, not their position, so reordering a section never moves an image to a different name.
- `photo{index}`: always present, starting at 1. Multi-photo slots (the hero strip) use 1…8. Single-photo slots use `photo1`, so a slot can grow later without renaming.
- `{width}`: the variant width in px. **Height is fixed by the slot ratio**, because the publisher crops to it.
- Lower-case, hyphens only. Names are case-sensitive at Cloudflare (purge matches the path exactly).

### 3.2 Slots, ratios and widths

The catalogue maps each existing DB key to a reserved name. DB keys don't change.

| DB key (unchanged) | Reserved name | Component | Ratio (w/h) | CSS width it renders at | Widths (px) | Heights (px) |
|---|---|---|---|---|---|---|
| `home-hero-1` … `home-hero-8` | `home-hero-strip-photo1` … `photo8` | `Landing/Hero.vue` | 0.75 (3:4) | 240 px (<1280) / 340 px | 480, 720, 1080 | 640, 960, 1440 |
| `home-intro` | `home-intro-portrait-photo1` | `Landing/Intro.vue` | 0.8 (4:5) | ≤ 500 px | 500, 1000, 1500 | 625, 1250, 1875 |
| `home-specialty-weddings` | `home-specialty-weddings-photo1` | `Landing/Specialties.vue` | 0.8 | ≤ 420 px | 420, 840, 1260 | 525, 1050, 1575 |
| `home-specialty-maternity` | `home-specialty-maternity-photo1` | 〃 | 0.8 | ≤ 420 px | 420, 840, 1260 | 525, 1050, 1575 |
| `home-specialty-family` | `home-specialty-family-photo1` | 〃 | 0.8 | ≤ 420 px | 420, 840, 1260 | 525, 1050, 1575 |
| `home-cta` | `home-cta-banner-photo1` | `Landing/CallToAction.vue` | 2.2 | 100vw, at least 880 px (min-height 400) | 880, 1320, 1760, 2400 | 400, 600, 800, 1091 |
| `portfolio-cover-{slug}` × 8 (couples, engagements, weddings, maternity, family, seniors, grads, events) | `portfolio-cover-{slug}-photo1` | `Portfolio/CategoryTiles.vue` | 0.8 | 50vw (<960) / 25vw | 400, 800, 1200 | 500, 1000, 1500 |
| *(reserved, not published — D12)* `home-recent-large`, `-top`, `-bottom` | `home-recent-large-photo1`, `home-recent-top-photo1`, `home-recent-bottom-photo1` | `Landing/Portfolio.vue` | 0.8 / 1.333 / 1.333 | | | |

**Totals:** 21 slots, **64 WebP files**. A full republish fits in **one** purge request (limit 100 URLs). The full URL list is in Appendix A.

Widths cover each slot's rendered CSS width at 1×, 2× and 3× density. The existing 400/800/1200/1600/2400 set doesn't fit these sizes as well (for example, 340 px @2× is 680, so 720 is the right step).

### 3.3 Empty slots: never 404 (D2 = a)

The publisher always writes **every** file for every slot. Each slot resolves its photo in this order (first Ready match wins):

| Slot | 1st | 2nd | 3rd |
|---|---|---|---|
| Hero strip photoN | explicit placement | `site-default` placement | built-in neutral image |
| Intro portrait, CTA banner | explicit | `site-default` | neutral image |
| Specialty {cat} | explicit | first Ready photo in {cat} by sort order *(new: a sensible default)* | `site-default` → neutral |
| Portfolio cover {cat} | explicit | first Ready photo in {cat} by sort order (**same rule as `coverFor` today**) | `site-default` → neutral |

- **`site-default`** is a new placement key, labelled "Fallback for any empty spot", using the existing placement mechanism. **No schema change.**
- **The neutral image** is a solid `#F8F2EF` (the `ivory-deep` background `ResponsivePhoto` already uses), rendered at the slot's ratio. It looks like the frame the site shows while loading today.
- **The admin page** marks a slot that's showing a fallback ("Hero strip, photo 4: showing fallback"), so empty spots are visible but never broken.
- **Behaviour change:** the hero strip always shows 8 frames. Today it drops empty slots; to keep that, choose D2 = c.

### 3.4 Dimensions without a DB call
- The slot catalogue (`shared/placement-slots.json`, §7) is the **single source** for ratio, widths and `sizes`. The frontend build and the Function both read it.
- The publisher **crops to the slot ratio around the admin's focal point** (clamped to the image edges). The frontend then knows exact `width`/`height` for every variant, with no manifest.
- **Side benefit:** because the focal point ends up near the centre of the crop, the CSS re-crop on the CTA's 400 px minimum height (a centred `cover`) still keeps the subject in frame. `object-position` isn't needed.
- **Source smaller than a variant:** the file is still written under that width name at the source's resolution (no upscaling) with the same ratio. Layout can't shift; the image is just softer at high density. The admin page warns when a slot's source can't fill its largest width.
- **Ratio changes:** if a component's ratio ever changes, update the catalogue and bump `recipeVersion`. The next publish re-crops every slot.

### 3.5 Formats
- **WebP** only (lossy, q82, `BestQuality`), the same encoder settings as today.
- **AVIF:** not possible with ImageSharp 3.1.12 (checked in Elysian's `Infrastructure.csproj`). No released ImageSharp version has an AVIF encoder; the HEIF/AVIF work (PR #2633) is unmerged. Options if you want it later:
  - **NeoSolve.ImageSharp.AVIF**: an ImageSharp plugin that shells out to the `avifenc` binary. You ship a native binary that matches the Function's OS.
  - **Magick.NET** or **NetVips** (libheif): native packages of roughly 30–60 MB, which lengthen cold start.

  In both cases AV1 encoding is several times slower than WebP. The gain is roughly 20–30% smaller files. Not worth it for 64 files today.
- **JPEG:** not included (D7).

---

## 4. Admin publish flow

```
admin action ─► existing command (DB) ─► enqueue {tenant, reason} ─► PublishPlacements (queue trigger)
                                                                    │
     ┌──────────────────────────────────────────────────────────────┘
     ▼
 1 lock → 2 desired state → 3 diff → 4 render → 5 write ALL → 6 purge → 7 re-purge (+60 s) → 8 confirm → 9 status
```

0. **Upload** (unchanged): browser → short-lived SAS → `photo-originals/aspensmitha/{photoId}/original.ext` → Event Grid → `ProcessPhoto` → existing immutable variants under `photos/`. When it finishes, `ProcessPhoto` enqueues a publish, because a slot may be waiting for that photo.
1. **Trigger.** In `server/PhotoFunctions.cs`, next to every `portfolioCache.Invalidate()` (`UpdatePhoto`, `ReorderPhotos`, `DeletePhoto`, `SetPlacement`, `ReprocessPhoto`, `ProcessPhoto`), enqueue `{ "tenant": "aspensmitha", "reason": "update" }` to the Storage queue `placements-publish`. The admin request returns immediately, so the 45 s SWA backend timeout can't be hit.
2. **Lock.** The `PublishPlacements` queue trigger takes a blob lease on `placements/aspensmitha/_publish.lock` (zero bytes). Only one publish runs per tenant even if the Function scales out. A message that can't get the lease is re-queued with a 15 s delay.
3. **Desired state.** Using `ElysianContext` (tenant set by the middleware), load Ready photos and placement rows. Resolve each catalogue slot through the §3.3 chain. Fingerprint = `sha256(photoId | version | focusX | focusY | recipeVersion)`, first 16 characters.
4. **Diff.** Compare against `x-ms-meta-fingerprint` on each slot's largest variant blob. Unchanged slots are skipped, so a burst of reorder messages costs one database read each.
5. **Render** (changed slots only, grouped by photo so each original is decoded once, one photo at a time to limit memory). Open the original via `IPhotoStorage.OpenOriginalAsync` (D9/D14). ImageSharp steps:
   - `AutoOrient`
   - strip EXIF/XMP/IPTC, keep ICC (same as `ImageSharpPhotoProcessor`)
   - crop to the slot ratio centred on the focal point, clamped
   - resize with Lanczos3 to each width, never upscaling
   - `WebpEncoder { Lossy, Quality = 82, BestQuality }`
6. **Write all.** Write every changed file before any purge:
   - path `placements/aspensmitha/{name}-{w}.webp`
   - `Content-Type: image/webp`
   - `Cache-Control: public, max-age=300`
   - metadata `fingerprint`, `photoId`, `version`, `publishedAt`
   - overwrite on

   This uses the Function's managed identity (Blob Data Contributor on `placements` only). If any write fails, the message is retried and nothing is purged, so Cloudflare keeps serving the complete old set.
7. **Purge.** `POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache` with `Authorization: Bearer {token}` and `{"files": [every written URL, all widths]}`, in chunks of up to 100. Require `"success": true`. On 429, follow `Retry-After`; on 5xx, back off and retry up to 3 times in-process, then fail the message (the queue retries it).
8. **Second purge** (+60 s, sent as a delayed queue message with the same file list). This closes a small race. A cache miss that reached Azure just before step 6 finished can return the old bytes and store them *after* step 7. With a 30-day edge TTL that would stick, so the delayed purge removes it.
9. **Confirm.** For each purged URL, `GET` via `images.aspensmithaphotography.com`. Expect:
   - `200`
   - `content-type: image/webp`
   - `etag` equal to the new blob's ETag
   - `cf-cache-status` not `HIT` on the first request

   This checks one Cloudflare location (the one nearest the Function); purge itself is global. Log the result to App Insights. On an ETag mismatch, purge once more, then fail the message.
10. **Status.** Release the lease and complete the message. `GET /api/manage/placements/status` returns `publishedAt` and fingerprint per slot (read from blob metadata) plus queue depth. The admin page shows **Publishing…** → **Live**.
11. **Failure.** After 5 dequeues the message goes to `placements-publish-poison`, and an App Insights alert on the poison queue fires. The admin page has **Republish site images** (`POST /api/manage/placements/publish`, `{force: true}` skips the diff) for backfill and recovery.

### Worst-case delay before every visitor sees the new image

| Stage | Worst case |
|---|---|
| Queue pickup (`maxPollingInterval` 5 s; longer if the Function is cold on Consumption) | ≈ 5 s – 1 min |
| Render + write (large originals, per changed photo) | ≈ 5 – 30 s |
| Purge propagation (Cloudflare: removed "instantly … across all data centers"; no number published) | seconds |
| Browser TTL for a visitor who fetched the old file just before the purge | **300 s** |
| **Total** | **≈ 7 minutes.** A new visitor sees it about 1 minute after Save. The admin's own browser may show the old image for up to 5 minutes unless they hard-refresh; the admin page will say so. |

If every retry fails, stale content can sit at the edge until the 30-day edge TTL ends (D5). The confirm step, the poison alert and the Republish button exist to catch this.

### Fallback: a manifest of versioned URLs (not recommended)
A short-cached `manifest.json` mapping slots to `photos/…/v{n}/…` immutable URLs would remove the purge dependency. The cost:
- an extra round trip before any placement image can start
- no static preload in HTML (the URL isn't known at build time)
- the frontend needs to see a manifest request finish before the LCP image

Use it only if Cloudflare purge turns out to be unreliable in practice.

---

## 5. Cloudflare: only the changes beyond what's live

### 5.1 Free plan limits (checked 2026-10-20 against Cloudflare docs)

| Item | Free plan |
|---|---|
| Cache Rules | **10** per zone. 1 used today (hostname rule); this plan adds 1. |
| Purge by URL (`files`) | Available. **800 URLs/s** (moving average), **100 URLs per request**. |
| Purge by prefix / hostname / tag / everything | **Available on Free.** 5 requests/min, burst bucket 25, 100 items per request. **Tags don't work here:** Cloudflare reads a `Cache-Tag` response header, and Azure Blob can't send custom response headers. **Prefix** is useful as an emergency "purge all placements" (`images.aspensmithaphotography.com/placements/aspensmitha/`). |
| Minimum Edge TTL (Cache Rule) | 2 hours |
| Minimum Browser TTL (Cache Rule) | 1 second |
| Smart Tiered Cache | Available (already on) |
| Request collapsing | Yes. On a miss, a cache lock sends only the first request to the origin; the others wait and are streamed the response. |
| Rule order | When several Cache Rules match and set the same setting, **the last matching rule wins**. |

### 5.2 Option a vs. b for tier 2 (D4)

**a. Header only (`Cache-Control: public, max-age=300, s-maxage=2592000`)**
- **Edge:** this would work. Cloudflare honours `s-maxage` over `max-age` for its own cache when the rule is set to use the origin header. (An Edge TTL *override* in a rule would take priority over `s-maxage`; the current rule doesn't override.)
- **Browser:** this is the problem. If the zone's **Browser Cache TTL** isn't "Respect existing headers", Cloudflare replaces any origin `max-age` that is **lower** than that setting. With the common 4-hour value, browsers would cache placements for 4 hours, not 5 minutes. That depends on a zone-wide setting nobody will think of when they change it later.

**b. Second Cache Rule (recommended)**
- Rule **"Placements: long edge, short browser"**, placed **after** the existing hostname rule (last match wins):
  - Expression: `(http.host eq "images.aspensmithaphotography.com" and starts_with(http.request.uri.path, "/placements/"))`
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **Ignore cache-control header and use this TTL → 30 days** (D5)
  - Browser TTL: **Override origin → 5 minutes** (D6)
- Doesn't depend on the zone's Browser Cache TTL. Visible in the dashboard. Uses 2 of 10 rules.
- The blobs still carry `Cache-Control: public, max-age=300`, so any other cache (and a future move to option a) behaves the same.
- The existing rule and everything under `/photos/` are unchanged, and keep `immutable` from the blob header.

### 5.3 Purge API usage
```http
POST https://api.cloudflare.com/client/v4/zones/{CLOUDFLARE_ZONE_ID}/purge_cache
Authorization: Bearer {CLOUDFLARE_API_TOKEN}
Content-Type: application/json

{"files": [
  "https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-480.webp",
  "https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-720.webp",
  "https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-1080.webp"
]}
```
- A single-slot change is 3–4 URLs; a full republish is 64.
- Use `https://`, a lower-case host, and the exact path (paths are case-sensitive).

### 5.4 API token
Dashboard → My Profile → API Tokens → **Create Custom Token**:
- **Permissions:** `Zone` → `Cache Purge` → `Purge`. Nothing else.
- **Zone resources:** `Include` → `Specific zone` → `aspensmithaphotography.com`.
- **Client IP filtering (optional):** the Function App's `possibleOutboundIpAddresses`.
- **Expiry:** set one (e.g. 12 months) and put a reminder on the calendar to rotate it.

Store it as Function App setting `Cloudflare__ApiToken`. Use a Key Vault reference if a vault is available (§12); otherwise an app setting (encrypted at rest). `Cloudflare__ZoneId` isn't secret.

### 5.5 Not changing
DNS, the custom domain, the SSL Configuration Rule (Full), the existing hostname Cache Rule, Tiered Cache, the root redirect, Resend records. **No CORS/Transform Rule** is needed with D3 = a.

---

## 6. Azure changes

| Change | Detail |
|---|---|
| **Container** | `placements` on `smithaconsultingprod`, anonymous access **Blob** (no listing). One-time, by an admin, not by the Function: `az storage container create --account-name smithaconsultingprod --name placements --public-access blob --auth-mode login`. It's served automatically at `https://images.aspensmithaphotography.com/placements/...`. |
| **Queues** | `placements-publish` and `placements-publish-poison`. Create both up front so RBAC can be scoped to each. |
| **Managed identity** | Turn on the **system-assigned** identity on Function App `aspensmitha`. |
| **RBAC** (least privilege) | **Storage Blob Data Contributor**, scope `…/storageAccounts/smithaconsultingprod/blobServices/default/containers/placements` only. **Storage Queue Data Contributor**, scope each of the two queues only. **Key Vault Secrets User** on the token secret, if a vault is used. Nothing at account level. |
| **Credentials in code** | New `BlobContainerClient(new Uri("https://smithaconsultingprod.blob.core.windows.net/placements"), new DefaultAzureCredential())`. Queue trigger via an identity-based connection (`PlacementsQueue__queueServiceUri`). **No new keys or connection strings.** The existing connection string stays for the code that already uses it (uploads, `photos/`, originals; D14). |
| **Blob headers** | Every placement blob: `Content-Type: image/webp`, `Cache-Control: public, max-age=300`. **No `immutable`.** `photos/` keeps `public, max-age=31536000, immutable` (unchanged code). |
| **CORS** | **None.** `<img>` and `<link rel=preload as=image>` without `crossorigin` don't use CORS. (Blob CORS is account-wide; leaving it alone avoids affecting other tenants.) |
| **App settings** | `PlacementPublishing__Enabled=true`, `PlacementPublishing__BlobContainerUri=https://smithaconsultingprod.blob.core.windows.net/placements`, `PlacementPublishing__PublicBaseUrl=https://images.aspensmithaphotography.com/placements/aspensmitha`, `PlacementsQueue__queueServiceUri=https://smithaconsultingprod.queue.core.windows.net`, `Cloudflare__ZoneId`, `Cloudflare__ApiToken` |
| **Function code** (this repo, D10) | See the file list below. |

**Server files** *(as originally planned; superseded: the publisher now lives in Elysian, see §13.1)*:
- `server/PlacementFunctions.cs` *(new)*:
  - `PublishPlacements` queue trigger
  - `POST manage/placements/publish` (Republish)
  - `GET manage/placements/status`

  The manage routes are behind SWA `authenticated` (`staticwebapp.config.json`) **and** must check the `photo.write` policy, like the MediatR `[Authorize]` requests do. Wrap them in MediatR requests with `[Authorize(Policy = PolicyNames.PhotoWrite)]`, and check that the Functions assembly is registered with MediatR so the authorization behaviour runs.
- `server/Placements/PlacementCatalog.cs`: reads `shared/placement-slots.json`.
- `server/Placements/PlacementResolver.cs`: DB → desired state, using the §3.3 fallback chain.
- `server/Placements/PlacementRenderer.cs`: ImageSharp crop + WebP encode.
- `server/Placements/PlacementStore.cs`: managed-identity writes, fingerprint metadata, lease.
- `server/Placements/CloudflarePurger.cs`: typed `HttpClient`, chunking, retries.
- `server/Placements/PlacementPublisher.cs`: orchestration of steps 2–10.
- `server/Placements/PlacementPublishQueue.cs`: `EnqueueAsync(reason)` used by `PhotoFunctions`.
- `server/PhotoFunctions.cs`: call `EnqueueAsync` beside each `portfolioCache.Invalidate()`.
- `server/Program.cs`: DI, `DefaultAzureCredential`, `AddHttpClient<CloudflarePurger>()`.
- `server/ElysianFunctions.csproj`: add `Azure.Identity`, `Azure.Storage.Queues`, `Microsoft.Azure.Functions.Worker.Extensions.Storage.Queues`; pin `SixLabors.ImageSharp` 3.1.12 explicitly (it's already transitive through Elysian); include `../shared/placement-slots.json` as Content.
- `server/host.json`: `"queues": { "batchSize": 1, "newBatchThreshold": 0, "maxPollingInterval": "00:00:05", "maxDequeueCount": 5 }`. About 17k polls a day: pennies a month.

---

## 7. Frontend changes, file by file

| File | Change |
|---|---|
| `shared/placement-slots.json` *(new, repo root)* | `recipeVersion` plus each slot: `key` (DB), `name` (reserved), `ratio`, `widths`, `sizes`, `alt` (D3 = a), `fallback` (§3.3). Read by Vite and the Function. |
| `clientapp/.env` | `VITE_PLACEMENT_IMAGE_BASE=https://images.aspensmithaphotography.com/placements/aspensmitha` (public, no secret) and `VITE_PLACEMENT_SOURCE=cdn` (`api` = rollback switch). |
| `clientapp/src/utils/sitePlacements.ts` | Read the shared catalogue; keep keys and labels as they are; add the `site-default` placement (D2). |
| `clientapp/src/utils/placementUrls.ts` *(new)* | `placementSrc(key, w)`, `placementSrcset(key)`, `placementSize(key, w)`. Built only from the catalogue: no store, no fetch. |
| `clientapp/src/utils/photoUrls.ts` | Add `PHOTO_SIZES.ctaBanner = '(max-width: 879px) 880px, 100vw'` (ambiguity 6). Existing presets unchanged. |
| `clientapp/src/components/Photo/PlacementPhoto.vue` *(new)* | A plain `<img>`: `src` (middle width), `srcset`, `sizes`, `width`/`height` (from ratio), `alt`, `loading` (`eager` for above the fold, else `lazy`), `fetchpriority`, `decoding="async"`. Wrapped in a box with CSS `aspect-ratio` + `object-fit: cover` and the ivory background, with a default slot for overlays (the CTA content). **It doesn't use `v-img`**, which loads through JavaScript and delays above-the-fold images. With `VITE_PLACEMENT_SOURCE=api` it renders the existing `ResponsivePhoto` + `forPlacement()`, so rollback is the old code path exactly. |
| `clientapp/src/components/Landing/Hero.vue` | `PlacementPhoto` for each `home-hero-strip-photoN`. Always 8 slides (D2 = a). `eager` + `fetchpriority="high"` for the slides visible at load (1, 2, 8; verify). Remove `usePhotoStore`. |
| `clientapp/src/components/Landing/Intro.vue`, `Specialties.vue`, `CallToAction.vue` | Switch to `PlacementPhoto`. The CTA uses the new `ctaBanner` sizes. |
| `clientapp/src/components/Portfolio/CategoryTiles.vue` | `PlacementPhoto` for `portfolio-cover-{slug}-photo1`. `fetchpriority="high"` on the first 4 tiles; no preload (they sit below the hero text, and below the fold on phones). |
| `clientapp/src/layouts/landing.vue` | Remove the layout-wide `usePhotoStore().load()` (Home and Portfolio no longer need it). |
| `About/Story.vue`, `About/Cta.vue`, `Contact/FormSection.vue`, `pages/portfolio.[category].vue`, `Booking/SessionCard.vue` | Call `photos.load()` in setup (it's already idempotent, sharing one in-flight request). Behaviour unchanged. |
| `clientapp/index.html` | Add `<link rel="preconnect" href="https://images.aspensmithaphotography.com">` (helps every page; `photos/` is on the same host). |
| `clientapp/src/utils/seo.ts` (`renderSeoHead('/')`) | For `/` only (D11), emit static tags built from the catalogue: `<link rel="preload" as="image" href="…/home-hero-strip-photo1-720.webp" imagesrcset="…-480.webp 480w, …-720.webp 720w, …-1080.webp 1080w" imagesizes="(max-width: 1279px) 240px, 340px" fetchpriority="high">`, plus normal-priority preloads for the other slides visible at load. These go into the built `dist/index.html` only. Skipped when `VITE_PLACEMENT_SOURCE=api`. |
| `clientapp/src/plugins/webVitals.ts` *(new, + `web-vitals` dependency)* | Send LCP / CLS / INP to GA4 (`G-3DVCNSHK1H`) for field data before and after. |
| `clientapp/src/pages/admin.photos.vue` | "Publishing… / Live" chip; **Republish site images** button; "showing fallback" flags; low-resolution warning per slot; a note that the admin's own browser may show the old image for 5 minutes; `CROP_PREVIEWS` taken from the real slot ratios (0.75, 0.8, 2.2) so the focal-point preview matches what gets published. |
| **Unchanged** | `ResponsivePhoto.vue`, `store/photos.ts` (still used elsewhere), galleries, Instagram, everything under `photos/`. |

---

## 8. Migration and rollback

### Migration (each step is safe to stop after)
1. **Prepare (no visitor impact).** Container `placements` (Blob access), both queues, managed identity + the three role assignments, Cloudflare token, app settings. Add Cache Rule b; it only matches `/placements/`, which is empty, so nothing changes.
2. **Deploy the backend** with `PlacementPublishing__Enabled=true`. The frontend still uses the API.
3. **Backfill.** Admin → **Republish site images**. All 21 slots × widths = 64 files, resolved from the current DB state, so the existing placements carry over exactly. Covers without an explicit pick get the same first-photo fallback the site shows today.
4. **Verify** with a script over Appendix A: every URL returns `200`, `content-type: image/webp`, `cache-control: max-age=300`; the second request is a `HIT`; the image is the right size. Check a `photos/` URL too: still `immutable`, still a HIT.
5. **Deploy the frontend** with `VITE_PLACEMENT_SOURCE=cdn`. It only references files verified in step 4, so there are no 404s.
6. **Watch for 1–2 weeks** (§10). Then remove the flag and the `api` branch of `PlacementPhoto`.

### Rollback
| Layer | Action | Time |
|---|---|---|
| Frontend | Set `VITE_PLACEMENT_SOURCE=api` (or revert the commit) → SWA redeploy. The exact current code path comes back. | ~5 min |
| Publisher | `PlacementPublishing__Enabled=false`. Enqueue becomes a no-op; the existing commands are unaffected. | ~1 min (app restart) |
| Cloudflare | Disable the `/placements/` Cache Rule. | instant |
| Data | **Nothing to roll back.** No DB schema change; fingerprints live in blob metadata; `photos/` is never touched. | — |
| Rule | **Don't delete the `placements` container while the frontend points at it.** | |

---

## 9. Expected CDN behaviour, origin load and egress

- **Per location:** the first request at a Cloudflare data center is a miss. With Smart Tiered Cache, the lower tier asks the **upper tier**; only an upper-tier miss reaches Azure. Later requests at that location are served from Cloudflare. Simultaneous misses for one file are collapsed into one fetch.
- **Not every request is a hit.** Low traffic means files get evicted from lower tiers between visits, so expect visible MISS/EXPIRED rates in places with few visitors. Those misses are usually filled from the upper tier, not Azure.
- **Burst after a purge:** Purge clears every data center, so the next request for each purged file is a miss. Smart Tiered Cache with a cloud origin uses one upper tier plus a fallback, so Azure sees **about 1–2 GETs per purged file**, however many visitors arrive.
  - A single-slot change is 3–4 files, about 0.3–0.8 MB from Azure.
  - A full republish is 64 files, about 8 MB in total (rough average around 130 KB per file), so about 8–16 MB from Azure.
  - The second purge (+60 s) repeats this once.
- **Steady state:** refills after eviction and expiry. Likely tens of MB a month at this site's traffic.
- **Azure egress and transactions:** at these volumes, effectively zero. Azure's internet egress has a monthly free allowance (100 GB at the time of writing; check against your subscription's pricing). Blob read transactions cost fractions of a cent per 10k.

---

## 10. Measuring success

**Baseline first** (before any deploy), then again after step 5.

| Metric | How | Before (expected) | Target after |
|---|---|---|---|
| First hero image visible, cold cache | WebPageTest, Atlanta/Dulles, Moto G Power, 4G, first view, 3 runs (median) | 5–7 s | **< 1.5 s** broadband, **< 2.5 s** 4G |
| When the first hero image request starts | WebPageTest waterfall | after `/api/portfolio` completes | **within ~300 ms of the HTML response** (preload) |
| `/api/portfolio` on `/` and `/portfolio` | Waterfall / DevTools | 1 request (critical path) | **0** |
| LCP (lab) | Lighthouse mobile, cold | record | **< 2.0 s** |
| LCP p75 (field) | GA4 web-vitals events (new plugin), CrUX when available | record | **< 2.5 s**, aiming for 2.0 s |
| CLS | Lighthouse / GA4 | record | **< 0.05** |
| Cache hit ratio, `/placements/` | Cloudflare dashboard → Caching analytics (Free plan shows limited breakdowns), plus `cf-cache-status` sampling | n/a | **> 90%** of requests after one week (lower in low-traffic places is expected) |
| Publish latency | App Insights: Save → confirm | n/a | **< 2 min** p95 |

**Header checks with `curl -I`:**
```bash
U=https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-720.webp
curl -sI "$U" | grep -iE '^(HTTP|cf-cache-status|cache-control|content-type|etag|age)'
curl -sI "$U" | grep -iE '^(HTTP|cf-cache-status|cache-control|content-type|etag|age)'
```
Expected:
- **1st request:** `HTTP/2 200`, `cf-cache-status: MISS` (or `EXPIRED`), `content-type: image/webp`, `cache-control: max-age=300` (Cloudflare writes this from the Browser TTL override; the exact form, with or without `public`, will show during verification).
- **2nd request:** the same, with **`cf-cache-status: HIT`** and an `age` header.
- **After a publish:** the next request is `MISS` with a **new `etag`**, then `HIT`.
- **Regression check on `photos/`:**
  ```bash
  curl -sI https://images.aspensmithaphotography.com/photos/aspensmitha/6cc70d8f-8d2f-412b-bd68-2f444cb6c42c/v1/800.webp
  ```
  should still show `cache-control: public, max-age=31536000, immutable` and a `HIT` on repeat.

---

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Purge fails silently or partly | Old image at the edge for up to the 30-day edge TTL | Check the `success` flag, confirm step, retries, poison-queue alert, Republish button, emergency prefix purge |
| Race: a miss in flight caches the old bytes after the purge | Old image sticks at one upper tier | Second purge at +60 s; the confirm step checks ETags |
| Crash between writes and purge | Some locations serve new files after a miss, others the cached old set, until the retry finishes | Write-all-then-purge; the message is retried and the step is idempotent |
| Admin sees a "fallback" image after deleting a photo | Confusing, but never broken | "Showing fallback" flag on the admin page; choose `site-default` once |
| Low-resolution source | Soft image at 2×/3× | Never upscale; admin warning |
| Large originals (MaxPixels 120 MP → ~360 MB RGB24 in memory) | Out of memory on small plans | One photo at a time; D9 = b is the escape hatch |
| Cold start delays publishing on Consumption | A slower "Live" (not visitor-facing) | 5 s polling; status chip |
| Hero always shows 8 frames (D2 = a) | Visible change if fewer than 8 are filled today | Check how many are filled (§12) |
| Generic alt text (D3 = a) | Weaker image SEO/a11y on hero slides | D3 = b later |
| Full (not strict) SSL to Azure | Cloudflare→Azure traffic is encrypted but the certificate isn't validated | Existing, accepted setup; unchanged |
| Cloudflare cache analytics on Free are limited | Harder to read the hit ratio | `cf-cache-status` sampling script plus GA4 timings |
| Canonical domain mismatch (D15) | SEO, independent of this work | Separate PR |

---

## 12. Open questions (couldn't check from here)

1. **How many hero slots are filled in production today?** If fewer than 8, D2 = a changes what visitors see.
2. **Function App plan and OS** (Consumption / Flex / Premium; Windows or Linux)? Affects cold start, publish latency, and whether a native AVIF encoder is ever possible.
3. **Is there a Key Vault** the Function can reference for the Cloudflare token?
4. **Other Cache Rules in the zone** besides the hostname rule? (They count toward the 10, and order matters.)
5. **The zone's Browser Cache TTL setting.** Only matters if you pick D4 = a.
6. Does `PhotoStorageSettings:PublicBaseUrl` in production already point at `https://images.aspensmithaphotography.com/photos`? The verified URL suggests yes; `photos/` is unaffected either way.
7. **Which hero slides are visible at load** at 375 px, 1440 px and 1920 px? I expect 1 + 2 + 8 from reading the Embla options; confirming it in a browser decides which images get preloaded.

---

## 13. Implementation (2026-10-20) and rollout runbook

### 13.1 What was built
| Area | Files |
|---|---|
| Slot catalogue (one source for both sides) | `clientapp/src/content/placementSlots.json`: 21 slots, 64 files, `recipeVersion: 1`, `siteDefaultKey: "site-default"`. Embedded in the Function App via `server/ElysianFunctions.csproj`. |
| Publisher (in **Elysian 0.0.49**, branch `feature/placement-publishing`) | `Application/Features/Placements/`: `PlacementCatalog`, `PlacementPaths` + `PlacementQueue`, `PlacementResolver` (fallback chain + fingerprints), `Commands/PublishPlacementsCommand` (orchestration, repurge, busy re-queue), `Commands/RepublishPlacementsCommand` and `Queries/GetPlacementStatusQuery` (both `[Authorize(PhotoWrite)]`), `Models/PlacementModels`. `Application/Interfaces/`: `IPlacementStore`, `IPlacementRenderer`, `ICdnPurger`, `IPlacementPublishQueue`. `Infrastructure/Services/`: `AzurePlacementStore`, `ImageSharpPlacementRenderer`, `CloudflareCdnPurger`, `AzurePlacementPublishQueue`, `PlacementStorageClients`. `Infrastructure/Settings/PlacementPublishingSettings` (+ `CloudflareSettings`). `AddPlacementFeatures(configuration, catalog)` in `Infrastructure/DependencyInjection.cs`. Tests: `tests/Elysian.Tests/Placements/PlacementTests.cs` (20). |
| Functions (aspensmitha.com, thin) | `server/PlacementFunctions.cs`: `PublishPlacements` queue trigger → `PublishPlacementsCommand`; `POST /api/manage/placements/publish` → `RepublishPlacementsCommand`; `GET /api/manage/placements/status` → `GetPlacementStatusQuery`. `server/PhotoFunctions.cs` and `server/StoryFunctions.cs` call `IPlacementPublishQueue.EnqueueAsync` beside every `portfolioCache.Invalidate()`. `server/Program.cs`: `AddPlacementFeatures(..., PlacementCatalog.FromEmbeddedResource(...))`. `server/host.json`: queue settings. `server/ElysianFunctions.csproj`: Elysian **0.0.49**, the queue extension, the embedded catalog. |
| Frontend | `utils/placementImages.ts` (URLs, sizes, preload tag; no `@/`/env so Vite can import it), `utils/placementConfig.ts` (flag), `components/Photo/PlacementPhoto.vue` (plain `<img>` from the CDN, or the old `ResponsivePhoto` path when the flag is `api`), Hero / Intro / Specialties / CallToAction / CategoryTiles switched to it, `layouts/landing.vue` + six API consumers load the photo store themselves, `utils/sitePlacements.ts` (`site-default`, `HERO_VISIBLE_AT_LOAD`, `HERO_PRELOAD`), `utils/photoUrls.ts` (`ctaBanner` sizes), `index.html` (preconnect), `vite.config.mts` (hero preload on `/` only + a build check that the catalogue matches `sitePlacements.ts`), `plugins/webVitals.ts` (+ `web-vitals` 4.2.4). |
| Admin | `components/Admin/PlacementPublishStatus.vue` (Live / Updating…, fallback list, Republish button) on `pages/admin.photos.vue`. `components/Admin/PhotoManager.vue`: crop previews use the real slot ratios (0.75 / 0.8 / 2.2), low-resolution warning per spot, "Whole site" group for `site-default`, `changed` event. |

**Checked:** Elysian builds and all 86 of its tests pass (20 new: catalog, crop, rendering, fallback chain, fingerprints, publish ordering, skip/busy/repurge/disabled, DI registration). The Function App builds against a local pack of the new Elysian. The client build passes (`vue-tsc` included). A throwaway harness rendered every slot from landscape, portrait and undersized sources: crops stay inside the image at the right ratio, every file decodes at the expected size, and all 64 sizes match the frontend's `width`/`height`. A build with `VITE_PLACEMENT_SOURCE=cdn` emits the three hero preloads in `dist/index.html` only.

**Not checked yet** (needs the Azure/Cloudflare setup below): a real publish, purge and confirm; the queue trigger with managed identity; how the page looks in `cdn` mode with real images.

### 13.2 Changes from the plan
- **`VITE_PLACEMENT_SOURCE` ships as `api`.** Merging to `main` deploys the frontend and the Function App at the same time, before any placement file exists. Switch to `cdn` (one line in `clientapp/.env`) after the backfill is verified (§13.3 step 6).
- **Story photos** (added in the "Add story page" commit) are handled. An explicit pick may be a story photo, but the category fallback skips story photos, matching `byCategory`. Story create, update, status and delete also trigger a publish.
- **Purge durability is stronger than §4 described.** Before writing anything, a safety-net purge of every planned URL is queued for +5 min. The +60 s second purge is queued *before* the first purge. Without both, a crash or a failed purge followed by a retry would find the fingerprints current, skip, and never purge.
- **The confirm step logs an error instead of failing the message**, because a retry would skip anyway. Alert on it (§13.3 step 7).
- **Admin status compares what each slot should show against what's published.** A failed enqueue therefore still shows as "Updating…", and Republish fixes it. It doesn't read queue depth.
- **ImageSharp 3.1.12 has 5 known vulnerabilities** (3 high, all in TIFF encoding, histogram equalisation and ICC/BigTIFF parsing). They're fixed only in **4.1.2**. This is already true of the live upload pipeline through Elysian; pinning the package here just makes the build warning visible. Uploads are admin-only. Upgrading means moving Elysian to ImageSharp 4.x: a separate task.
- D15 (the `aspensmitha.com` canonical domain) is **not** changed here.
- **Home CTA banner: `max-height: 85vh` removed (2026-10-21).** It cropped the already-cropped 2.2 file a second time on laptop screens.

**Publishing Elysian:** merge `feature/placement-publishing` into Elysian `master`, then tag `v0.0.49` (the release workflow packs from the tag and requires the commit to be on `master`). Until 0.0.49 is on the feed, the aspensmitha.com server won't restore.

### 13.3 Rollout runbook
Do these **in order**. Steps 1–4 have no effect on visitors.

**1. Azure: container and queues** (as an admin; `--auth-mode login` needs data-plane roles, `--auth-mode key` doesn't)
```bash
ACC=smithaconsultingprod
az storage container create --account-name $ACC --name placements --public-access blob --auth-mode key
az storage queue create --account-name $ACC --name placements-publish --auth-mode key
az storage queue create --account-name $ACC --name placements-publish-poison --auth-mode key
```

**2. Azure: managed identity + least-privilege roles**
```bash
FUNC=aspensmitha; FUNC_RG=<function app resource group>
PRINCIPAL=$(az functionapp identity assign -g $FUNC_RG -n $FUNC --query principalId -o tsv)
SA_ID=$(az storage account show -n smithaconsultingprod --query id -o tsv)
az role assignment create --assignee-object-id $PRINCIPAL --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" --scope "$SA_ID/blobServices/default/containers/placements"
for Q in placements-publish placements-publish-poison; do
  az role assignment create --assignee-object-id $PRINCIPAL --assignee-principal-type ServicePrincipal \
    --role "Storage Queue Data Contributor" --scope "$SA_ID/queueServices/default/queues/$Q"
done
```
Role assignments can take a few minutes to take effect.

**3. Cloudflare**
- **API token:** Custom Token → `Zone · Cache Purge · Purge`, Zone Resources `Include · Specific zone · aspensmithaphotography.com`, with an expiry date. Store it in Key Vault (or as an app setting). Copy the **Zone ID** from the zone overview.
- **Cache Rule**, placed **after** the existing hostname rule:
  - Name: "Placements: long edge, short browser"
  - Expression: `(http.host eq "images.aspensmithaphotography.com" and starts_with(http.request.uri.path, "/placements/"))`
  - Eligible for cache
  - Edge TTL: *Ignore cache-control header and use this TTL* → **30 days**
  - Browser TTL: *Override origin* → **5 minutes**

**4. Function App settings, BEFORE deploying the backend.** The queue trigger needs `PlacementsQueue__queueServiceUri` to start.
```bash
az functionapp config appsettings set -g $FUNC_RG -n $FUNC --settings \
  PlacementPublishing__Enabled=true \
  PlacementPublishing__BlobContainerUri=https://smithaconsultingprod.blob.core.windows.net/placements \
  PlacementPublishing__PublicBaseUrl=https://images.aspensmithaphotography.com/placements \
  PlacementsQueue__queueServiceUri=https://smithaconsultingprod.queue.core.windows.net \
  Cloudflare__ZoneId=<zone id> \
  "Cloudflare__ApiToken=@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/cloudflare-purge-token/)"
```

**5. Deploy** (merge to `main`, flag still `api`). Then **Admin → Photos → Republish site photos**. The status chip goes from "Updating 21 site photos…" to "live".

**6. Verify, then switch the frontend**
```bash
# Every reserved URL exists and is WebP (prints only problems)
grep -o 'https://images\.aspensmithaphotography\.com/placements/[^ |]*\.webp' docs/plans/placement-images-cdn.md \
  | while read -r u; do curl -s -o /dev/null -w "%{http_code} %{content_type} $u\n" "$u"; done | grep -v '^200 image/webp'
# Cache behaviour on one file: MISS (or EXPIRED) then HIT, cache-control max-age=300
U=https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-720.webp
for i in 1 2; do curl -sI "$U" | grep -iE '^(HTTP|cf-cache-status|cache-control|content-type|etag|age)'; echo; done
# photos/ unchanged: still immutable, HIT on repeat
curl -sI https://images.aspensmithaphotography.com/photos/aspensmitha/6cc70d8f-8d2f-412b-bd68-2f444cb6c42c/v1/800.webp | grep -iE '^(cf-cache-status|cache-control)'
```
Then edit one placement in the admin and confirm its URL shows a new `etag` and `MISS` within about a minute. When everything checks out, set `VITE_PLACEMENT_SOURCE=cdn` in `clientapp/.env` and push.

**7. Alerts** (App Insights): an alert on traces containing `Placement purge not confirmed` or `Cloudflare purge failed`, on exceptions in `PublishPlacements`, and on the `placements-publish-poison` queue having any messages.

**Local development (Azurite).** Add to `server/local.settings.json` `Values`:
`"PlacementPublishing__Enabled": "true"`, `"PlacementPublishing__ConnectionString": "UseDevelopmentStorage=true"`, `"PlacementPublishing__PublicBaseUrl": "http://127.0.0.1:10000/devstoreaccount1/placements"`, `"PlacementsQueue": "UseDevelopmentStorage=true"`.
Then in `clientapp/.env.local`: `VITE_PLACEMENT_SOURCE=cdn` and `VITE_PLACEMENT_IMAGE_BASE=http://127.0.0.1:10000/devstoreaccount1/placements/aspensmitha`. Purge is skipped automatically when no Cloudflare settings are present.

**Rollback:** `VITE_PLACEMENT_SOURCE=api` (frontend) and/or `PlacementPublishing__Enabled=false` (backend). Nothing in the database changed.

---

## Sources
- [Cloudflare: Purge cache (methods, Free plan availability, rate limits)](https://developers.cloudflare.com/cache/how-to/purge-cache/)
- [Cloudflare: Purge by single-file](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/)
- [Cloudflare: Purge API (`purge_cache`, token permission)](https://developers.cloudflare.com/api/resources/cache/methods/purge/)
- [Cloudflare: Cache Rules (10 on Free)](https://developers.cloudflare.com/cache/how-to/cache-rules/)
- [Cloudflare: Cache Rules order (last match wins)](https://developers.cloudflare.com/cache/how-to/cache-rules/order/)
- [Cloudflare: Edge and Browser Cache TTL minimums](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)
- [Cloudflare: Browser Cache TTL overrides lower origin max-age](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/set-browser-ttl/)
- [Cloudflare: Origin Cache-Control (`s-maxage`, Edge TTL overrides)](https://developers.cloudflare.com/cache/concepts/cache-control/)
- [Cloudflare: Default cache behaviour (cache lock / request collapsing)](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Cloudflare: Tiered Cache](https://developers.cloudflare.com/cache/how-to/tiered-cache/)
- [ImageSharp HEIF/AVIF PR #2633 (mirror)](https://kzserverkenguru.duckdns.org/SixLabors/ImageSharp/pull/2633)
- [NeoSolve.ImageSharp.AVIF](https://www.nuget.org/packages/NeoSolve.ImageSharp.AVIF)

---

## Appendix A: every reserved URL (64)

| Reserved name | Size (w×h) | URL |
|---|---|---|
| `home-hero-strip-photo1` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-480.webp |
| `home-hero-strip-photo1` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-720.webp |
| `home-hero-strip-photo1` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo1-1080.webp |
| `home-hero-strip-photo2` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo2-480.webp |
| `home-hero-strip-photo2` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo2-720.webp |
| `home-hero-strip-photo2` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo2-1080.webp |
| `home-hero-strip-photo3` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo3-480.webp |
| `home-hero-strip-photo3` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo3-720.webp |
| `home-hero-strip-photo3` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo3-1080.webp |
| `home-hero-strip-photo4` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo4-480.webp |
| `home-hero-strip-photo4` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo4-720.webp |
| `home-hero-strip-photo4` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo4-1080.webp |
| `home-hero-strip-photo5` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo5-480.webp |
| `home-hero-strip-photo5` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo5-720.webp |
| `home-hero-strip-photo5` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo5-1080.webp |
| `home-hero-strip-photo6` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo6-480.webp |
| `home-hero-strip-photo6` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo6-720.webp |
| `home-hero-strip-photo6` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo6-1080.webp |
| `home-hero-strip-photo7` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo7-480.webp |
| `home-hero-strip-photo7` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo7-720.webp |
| `home-hero-strip-photo7` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo7-1080.webp |
| `home-hero-strip-photo8` | 480×640 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo8-480.webp |
| `home-hero-strip-photo8` | 720×960 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo8-720.webp |
| `home-hero-strip-photo8` | 1080×1440 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-hero-strip-photo8-1080.webp |
| `home-intro-portrait-photo1` | 500×625 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-intro-portrait-photo1-500.webp |
| `home-intro-portrait-photo1` | 1000×1250 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-intro-portrait-photo1-1000.webp |
| `home-intro-portrait-photo1` | 1500×1875 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-intro-portrait-photo1-1500.webp |
| `home-specialty-weddings-photo1` | 420×525 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-weddings-photo1-420.webp |
| `home-specialty-weddings-photo1` | 840×1050 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-weddings-photo1-840.webp |
| `home-specialty-weddings-photo1` | 1260×1575 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-weddings-photo1-1260.webp |
| `home-specialty-maternity-photo1` | 420×525 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-maternity-photo1-420.webp |
| `home-specialty-maternity-photo1` | 840×1050 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-maternity-photo1-840.webp |
| `home-specialty-maternity-photo1` | 1260×1575 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-maternity-photo1-1260.webp |
| `home-specialty-family-photo1` | 420×525 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-family-photo1-420.webp |
| `home-specialty-family-photo1` | 840×1050 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-family-photo1-840.webp |
| `home-specialty-family-photo1` | 1260×1575 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-specialty-family-photo1-1260.webp |
| `home-cta-banner-photo1` | 880×400 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-cta-banner-photo1-880.webp |
| `home-cta-banner-photo1` | 1320×600 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-cta-banner-photo1-1320.webp |
| `home-cta-banner-photo1` | 1760×800 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-cta-banner-photo1-1760.webp |
| `home-cta-banner-photo1` | 2400×1091 | https://images.aspensmithaphotography.com/placements/aspensmitha/home-cta-banner-photo1-2400.webp |
| `portfolio-cover-couples-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-couples-photo1-400.webp |
| `portfolio-cover-couples-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-couples-photo1-800.webp |
| `portfolio-cover-couples-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-couples-photo1-1200.webp |
| `portfolio-cover-engagements-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-engagements-photo1-400.webp |
| `portfolio-cover-engagements-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-engagements-photo1-800.webp |
| `portfolio-cover-engagements-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-engagements-photo1-1200.webp |
| `portfolio-cover-weddings-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-weddings-photo1-400.webp |
| `portfolio-cover-weddings-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-weddings-photo1-800.webp |
| `portfolio-cover-weddings-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-weddings-photo1-1200.webp |
| `portfolio-cover-maternity-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-maternity-photo1-400.webp |
| `portfolio-cover-maternity-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-maternity-photo1-800.webp |
| `portfolio-cover-maternity-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-maternity-photo1-1200.webp |
| `portfolio-cover-family-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-family-photo1-400.webp |
| `portfolio-cover-family-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-family-photo1-800.webp |
| `portfolio-cover-family-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-family-photo1-1200.webp |
| `portfolio-cover-seniors-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-seniors-photo1-400.webp |
| `portfolio-cover-seniors-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-seniors-photo1-800.webp |
| `portfolio-cover-seniors-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-seniors-photo1-1200.webp |
| `portfolio-cover-grads-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-grads-photo1-400.webp |
| `portfolio-cover-grads-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-grads-photo1-800.webp |
| `portfolio-cover-grads-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-grads-photo1-1200.webp |
| `portfolio-cover-events-photo1` | 400×500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-events-photo1-400.webp |
| `portfolio-cover-events-photo1` | 800×1000 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-events-photo1-800.webp |
| `portfolio-cover-events-photo1` | 1200×1500 | https://images.aspensmithaphotography.com/placements/aspensmitha/portfolio-cover-events-photo1-1200.webp |
