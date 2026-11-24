# Phase 5: cloud-photography

Status: written 2026-11-22, updated 2026-11-23. Every build step except own domains (step 13) is built and
live; no tenant who isn't a test has gone live yet (step 12). "Where it stands" below is the summary, the
build order has a status for each step, and each decision that was built differently from how it was
written has an **As built** note saying how.
Parent plan: `elysian-sites-platform.md`.

## Where it stands (2026-11-23)

**Live:**

- Cloud sites are served by the `cloud-photography` Worker at `{tenant}.framenice.com`. A new cloud site
  gets that address, answering and primary, the moment it is created.
- Two templates, `classic@1` and `gallery@1`, with the same pages, wording, categories and photo spots. An
  owner changes template from the admin app; a platform admin picks one when creating a site.
- Images come from `images.smithadigital.com` (the `elysian-images` Worker), purged from the
  `smithadigital.com` zone after a placement is republished.
- The admin's "Look and wording" screen edits a site page by page, with a preview of the draft beside it.
  The same preview link opens the whole draft site in a tab.
- Contact form and online booking on cloud sites, with mail sent as the site from `send.framenice.com` to
  a contact address the owner has confirmed by code.
- Platform screens: list, create, suspend and restore sites; addresses; the Booking add-on; download a
  copy of a site; delete a suspended site for good.

**Not built:**

- Own domains attached by the platform itself (step 13). It needs a Cloudflare token allowed to attach
  Worker domains, which is the most powerful credential in the system, and that is to be agreed before any
  code. Until then an own domain is attached by hand, which works and was proven on 2026-11-23 with
  `smithaconsulting.com` on `cloud-site`: see "Attaching an own domain by hand" under decision 7.
- From the decisions below: an edge-clients screen (decision 10), and the deploy hook for Aspen's manifest.
- Seeing a template's crops before changing to it (decision 2).

**Known gaps in what is built:**

- The home page's "A recent story" links to the portfolio, not to a story.
- Session lists have no cover photos.
- A cloud site can set its booking time zone but not its hours.
- Links a page builds with script (a story in a gallery, "book this session") do nothing inside a preview.
- A site is kept out of search results until its owner first publishes: every page says `noindex` and
  there is no sitemap. From the first publish its pages are indexable, `/robots.txt` names the sitemap, and
  `/sitemap.xml` lists its pages and published stories (kept an hour at the edge; the backend is asked for
  the stories and the pages are listed without them when it can't answer).
- The images Worker still keeps a placement at the edge for only a minute (`PLACEMENT_EDGE_SECONDS`), a
  safety net from before purging worked. It can come out.
- A story page's first photo waits on an API call (decision 5).

**Test sites:** `cloud-site` is the only one left. `address-test` was created and deleted on 2026-11-23,
which is the one real run of delete so far.

## Goal

A photographer gets a working site without a repo, a build or any change in Azure. An operator (later, a
signup page) creates the tenant; the owner signs in to `manage.smithadigital.com`, uploads photos, picks
colours and wording, and publishes. One Worker, `cloud-photography`, serves every such site.

Done when: a new tenant goes live at `{tenant}.{brand domain}` from the admin app alone, its home page's
largest image is on screen without any call to the Function App, and nobody touched Azure or Cloudflare by
hand to make it happen.

## What existed when this was written (2026-11-22)

Kept for the record. Everything in the "Not built" table has since been built.

**Already built and live:**

- One backend for every tenant (`elysian-sites`), with modules checked per request, tenant settings and
  secrets per tenant, memberships and invites.
- `CreateTenantCommand`, `SetTenantStatusCommand`, `SetTenantModuleCommand` and the edge-client commands,
  reachable only by the admin app's credential. No screens for them yet.
- An edge-client scope for "every tenant on one platform's shared template", which is what the cloud Worker
  needs. Nothing uses it yet.
- The admin app: photos, stories, sessions, integrations, people. It draws every site from that site's
  stored manifest, so it already works for a tenant it has never seen.
- The photo pipeline and the placement publisher, per tenant, reading slots from the stored manifest.
- The shared UI library (`packages/ui`): API client, sign-in, photo and placement helpers, `ResponsivePhoto`,
  `PlacementImage`, `StoryHero`.

**Not built then:**

| Missing | Why Phase 5 needs it |
|---|---|
| A site template | There is no public site code that isn't Aspen's |
| Contact and booking components in the library | They exist only inside Aspen's repo, with her wording and stores |
| Site content: theme, wording, draft and publish | A cloud owner has no other way to make the site theirs |
| An edge store (Cloudflare KV) and the code that writes to it | Public pages must not wait on the Function App |
| Tenant domains (`TenantDomain`) and the host map | The cloud Worker learns its tenant from the hostname |
| A shared images host | `images.aspensmitha.com` is Aspen's; a storage account takes one custom domain |
| Per-tenant email identity and quotas | Today the From address and limits come from one site's settings |
| Platform admin screens | Creating a tenant is still an API call |
| A brand domain | Tenant sites must not share a registrable domain with the admin app |

## Decisions

### 1. Two different things are called "manifest". Name them apart.

| Name | What it is | Who writes it | Who reads it |
|---|---|---|---|
| **Site manifest** (exists) | The site's structure: categories, pages, spots, image slots, map layouts | The site's build (custom), or the template (cloud) | Admin app, placement publisher |
| **Site content** (new) | What the owner chose: colours, fonts, wording, SEO text, links, logo | The owner, in the admin app | The cloud Worker, from the edge store |

For a cloud tenant the site manifest is the template's, stored when the tenant is created and replaced when
the tenant moves to a new template version. The owner never edits structure. This keeps every guard Phase 4
put on the manifest (a slot's public name never changes, a publish never starts from an empty catalogue).

**As built:** a cloud tenant stores no manifest. Its manifest is its template's, made out for the site each
time it is read (its name, its primary address, the owner's category names), so nothing is copied and
nothing goes stale. Moving to another template is a change to the tenant's `TemplateKey`.

### 2. Two templates, one at a time: `classic` first, `gallery` second

Agreed 2026-11-22, from three looks on a design canvas (https://claude.ai/artifact/CmkRteYqj6HcFPu91QR2gC).

- **`classic@1` is built first, end to end:** large serif headings, a centred layout, square-cornered photos
  (the canvas's option B). The first tenant goes live on it.
- **`gallery@1` follows on the same foundations:** white, a bold modern sans, rounded photo frames (option A).
- **Both have the same pages and the same categories.** Pages: Home, Portfolio, a gallery per category, a
  story page, About, Contact; Investment and Booking when the tenant has the Booking module. Each is a Vue
  app under `elysian-platform/templates/photography/`, prerendered at build time, built on `packages/ui`.
- **Wording that means the same has the same field key in both** (`home.heading`, `about.body`,
  `footer.line`), so a change of template keeps what the owner wrote. A host test holds every template to
  the shared keys.
- **Each template owns its own slot catalogue.** The two crop photos differently (classic's hero is a wide
  strip, gallery's a portrait), so every tenant on one template has the same slots, ratios and widths, and
  the page knows every reserved image's address and size with no call.
- **Changing template is one operation:** store the new template's site manifest, re-render the reserved
  images to its crops, and only then point the site at the new look. The old look keeps serving until that
  finishes. The owner's photo picks carry over; the admin shows the new crops before the switch goes live.
- The template owns the list of categories on offer. An owner switches categories on or off and renames
  them; the slug is fixed, because it is in public addresses and storage paths.

**As built:**

- Both templates are built. What they share (the forms, the booking calendar, the gallery and story
  scripts, and the renderer) is in `templates/photography/shared`; each template has its own page, stylesheet,
  schema and manifest. A test holds `gallery` to `classic`'s fields, pages, categories and spots.
- The two templates have the same spot keys, so picks carry over, but each stores its images under its own
  file names (`home-hero-…` and `g-home-hero-…`). Both sets can exist for one site, which is what lets the
  old look keep serving while the new one's images are rendered.
- Changing template: the request is recorded in the tenant's settings and carried by the placement-publish
  queue message. That job renders the new template's images, then moves the draft, the tenant's record and
  the edge, in that order. Colours and fonts belong to a template, so they fall back to the new template's
  own where it has no palette or font of the same name; wording, links and category names are kept.
- Not built: showing the new crops before the switch. The owner sees them afterwards and can change back.

### 3. What the owner can change, and what is fixed

This is the boundary the shared components are built to (decision 4). **Recommended:**

| The owner chooses | How it is constrained |
|---|---|
| Colour palette | One of a set of presets, plus an optional accent colour. Checked for WCAG AA contrast against the text placed on it before it can be published. |
| Fonts | One of a few heading and body pairings, all self-hosted with the template. No arbitrary font URLs. |
| Logo or wordmark | Text, or an image that goes through the photo pipeline. No SVG upload. |
| Wording | Named fields with a length limit each: headings, intro, about text, call-to-action labels, footer line |
| SEO | Site title, description per page, share image (a photo of theirs) |
| Links | Instagram and similar, `https://` only, shown as plain links |
| Contact details | The email that receives messages (verified before use), location line |
| Which categories and pages show | From the template's list |

Fixed: layout, spacing, which component goes where, image ratios, everything in the HTML that isn't one of
the fields above. No custom HTML, CSS or scripts, ever. That rule is what lets one Worker serve everyone
safely and keeps every site fast.

The fields live in `template.schema.json`, shipped with each template version. Elysian validates content
against the schema for the tenant's pinned version; the admin app builds its editing screen from the same
file. Adding a field is a schema change, not an admin app change.

**As built:** palettes with an optional accent (contrast-checked), font pairings, wording, links, the
contact email, categories, and a site title and description for search. The schema also lays its fields
out by page and section (`pages`, and `section` and `help` on each field), which is what the editing screen
is drawn from. Added since: payment and gallery policies, which make a Policies page when written. Not
built: a logo image, a description per page, a share image.

### 4. Shared components take everything they need as props. They hold no site's data.

**Recommended.** Contact and booking components move from Aspen's repo into `packages/ui` with these rules:

- **No stores, no fetching of their own structure.** A component gets its API client, its sessions, its
  wording and its Turnstile site key from the site that renders it. Aspen's site passes hers; the template
  passes what the Worker injected.
- **Wording is props with sensible defaults, and slots where a site wants more than text.** Aspen's copy
  stays in her repo and is passed in.
- **Look comes from the Vuetify theme and a short list of CSS variables** (fonts, corner radius, section
  spacing). Components never name a colour.
- **Behaviour is not configurable.** Validation, the Turnstile handshake, slot selection and the "someone
  booked it first" recovery are the same everywhere.
- The story display components already follow this; `StoryHero` is the pattern.

The extraction changes nothing on Aspen's live site. Her site moves onto the library versions after the
watch ends (about 6 December), a few components at a time with LCP checked, as Phase 4 step 9 says.

**As built:** the templates don't use Vue components in the browser at all (decision 5). What they take
from `packages/ui` is the rules and wording: `forms`, `booking`, `stories` and `placements`. The forms
themselves are finished HTML with a small script each, shared by both templates. Aspen's move onto the
library is still to come (branch `feature/site-on-ui-library`).

### 5. How a cloud page is served

As the parent plan's section 4, made concrete:

1. The Worker looks up `host:{hostname}` in KV and gets `{ tenant, status, template, contentVersion }`. It
   keeps the answer in memory for 60 seconds. An unknown host is a 404. A suspended tenant gets a plain
   "this site is unavailable" page.
2. It reads `content:{tenant}:{contentVersion}` from KV.
3. It streams the template's prerendered HTML for that path through `HTMLRewriter`, adding: the title and
   share tags, one `:root{…}` block of theme variables, the hero `<link rel="preload">`, and the wording as
   inline JSON for the app to pick up.
4. The response is cached at the edge by host, path and content version. Publishing bumps the version, so
   nothing is ever purged.
5. Scripts, styles and fonts are the template's static assets: the same files for every tenant, cached
   forever.

**As built:** there is no prerendered HTML and no `HTMLRewriter`. The Worker draws each page with Vue's
server renderer from the content and the template, and the result is finished HTML: the wording is in the
markup, not in inline JSON, and no app starts in the browser. Most pages carry no script at all and are
served with `script-src 'none'`. A gallery, a story, the session lists and the two forms each load one
small script of the template's own. A page is cached per host, path, content version, template, deploy of
the Worker and whether the site has Booking, so a publish, a template change or a deploy is seen at once
and nothing is purged.

**Rules for anything injected.** Text is escaped for where it lands (element text, attribute, or JSON inside
a script tag, where `<` is written as an escape so content can never close the tag). Theme values are never
copied from the content as strings: the Worker writes variables only from values that parse as a colour or
match a known font key. Links are `https:` only.

**What still calls the API, and why that is acceptable.** Gallery photo lists, story pages and booking
times, as on Aspen's site today. None of them is needed to show the first image:

- The home hero and every other reserved spot are fixed addresses with known sizes (decision 6).
- A gallery page's first row is below a heading and is lazy-loaded; a story page is the one place where the
  largest image depends on a call. **Recommended:** publish each story's hero address and size into the
  content snapshot when the story is published, so the Worker can preload it. Galleries stay on the API for
  now; move their first row into the snapshot only if the numbers ask for it.

  **As built:** not done. A story page keeps room for its first photo, so nothing shifts, but the photo
  itself waits on the API call. Accepted for now.

**Failure modes**

| What fails | What the visitor gets |
|---|---|
| Content missing or unreadable in KV | The template's default wording and theme, and a log entry. Never a blank page. |
| KV unreachable | The Worker's in-memory copy if it has one, else the defaults |
| Function App cold or down | Pages and reserved images as normal. Galleries, stories and forms wait or show their error state. |
| A reserved image never published | Cannot happen for a live tenant: see decision 6 |

### 6. Images: one shared host, and no fixed address is ever empty

- `images.smithadigital.com` is a small Worker in front of the same blob containers, serving
  `photos/{tenant}/…` and `placements/{tenant}/…`. It only ever answers with `image/webp` and `nosniff`,
  and only for those two prefixes. Aspen keeps `images.aspensmitha.com` untouched.
- Cache rules match hers: versioned photo paths are immutable; placement addresses get a 30-day edge life
  and 5 minutes in the browser, purged by address after a publish.
- Each tenant's public image base is a tenant setting, which Elysian already reads per tenant.
- **Creating a tenant publishes its placements before its host entry is written.** With no photos yet, every
  slot resolves to the neutral frame, so every fixed address answers from the first request. A cloud site
  that 404s on a reserved image is the same bug it is on Aspen's.
- The placement `<img>` rules in `CLAUDE.md` apply to the template unchanged: plain `<img>`, `width` and
  `height`, `srcset` and an honest `sizes`, eager and high priority for the hero only, preload on `/` only.

**As built:**

- Which host a tenant's images are on is decided by its runtime, not a tenant setting: a cloud tenant gets
  `PlatformImages:PublicOrigin`, a custom one keeps the host's own setting. The purger sends each address
  to the zone it is in (`PlatformImages:CloudflareZoneId` and its own token for the platform's host).
- Two things about caching that were learned the hard way on 2026-11-23. A `workers.dev` address can't be
  purged, so the images Worker must be on its own domain before placements are cached for long. And a
  Worker's request to storage is itself cached by Cloudflare for as long as storage says a browser may keep
  the answer, under the storage address, so the Worker asks for placements with `no-store`.
- A preview page asks for its placement images afresh each minute, so an owner who has just changed a photo
  sees it without a hard reload. Visitors' pages keep the five-minute browser life.

### 7. Domains: subdomains first, own domains second

- **The brand domain is `framenice.com`**, registered through Cloudflare, so its DNS is already where the
  Worker needs it. It is a different registrable domain from `smithadigital.com`, which keeps tenant content
  apart from the admin app.
- **Subdomain (every tenant):** one wildcard record and one wildcard route on the cloud Worker cover
  `{tenant}.{brand}`. Creating a tenant writes a KV entry and nothing else.
- **Own domain (optional, a later step in this phase):** bought in the operator's Cloudflare account,
  attached to the Worker as a custom domain by `AttachTenantDomainCommand` through Cloudflare's API. The
  tenant's subdomain then redirects to it.
- One primary host per tenant; every other host 301s to it. Removing a domain deletes the KV entry first.
- `TenantDomain` (host, status, kind, primary flag) is the record. The KV host map is derived from it and
  can be rebuilt from SQL at any time.
- Tenant identifiers are already validated against a reserved list. Add the template's own paths and
  `preview` to it.

Until the brand domain exists, the Worker is built and tested on its `workers.dev` address with a fixed test
tenant, the way Aspen's Worker was.

**As built:** the wildcard record and route are live. The domain a platform's sites go under is a setting
(`PlatformDomains:Domains:photography`), and creating a cloud site records `{identifier}.framenice.com` as
its primary address and tells the edge. The preview is a `?preview=` parameter on any page, not a path, so
no identifier had to be reserved for it. Attaching an own domain from the admin is not built; it is done
by hand.

#### Attaching an own domain by hand

The domain has to be in the operator's Cloudflare account. It need not be registered there: adding it to
Cloudflare and pointing its nameservers at the two Cloudflare gives is enough.

1. **DNS.** In the domain's DNS records, delete anything on the bare name and on `www` (a registrar's
   parking records, usually two `A` records and a `www` CNAME). A domain can't be attached to a Worker
   while a record sits on the name. Leave mail records alone.
2. **Worker.** Workers & Pages, `cloud-photography`, Settings, Domains & Routes, Add, Custom domain. Pick
   the domain from the list rather than typing a full name, add it with the subdomain empty, then again
   with `www`. Typing `www.example.com` in full finds no match and offers to onboard it as a new domain,
   which is wrong. Cloudflare makes the DNS records and certificates.
3. **HTTPS.** In the domain's SSL/TLS settings, Edge Certificates, turn on Always Use HTTPS. A new domain
   has it off, and the page then also answers over plain http.
4. **Turnstile.** Add the bare domain to the widget's hostnames; it covers `www`. Without it the contact
   form's check fails on the new address.
5. **Admin.** Sites, Manage, Addresses: add `www.example.com` and `example.com`, each ticked as already
   answering, and make one primary. Within a minute the other and the `framenice.com` subdomain 301 to it.
   Browsers keep that redirect for an hour.
6. **Check.** The primary answers 200 with itself as the canonical address, the others 301 to it, images
   load, and the contact form sends.

To take a domain away, remove the address in the admin first, then the custom domain in Cloudflare.

### 8. Editing, preview and publish

- **Draft and published are separate.** The owner edits a draft in SQL. Publish validates it, writes
  `content:{tenant}:{n+1}` to KV, then repoints the host entries. Write first, switch second, as placements do.
- **Preview** uses a short-lived signed link, the same mechanism as draft story previews. The Worker sees
  the token, asks the API for the draft and renders with it, uncached and marked `noindex`. That is the one
  path where a cloud page calls the Function App, and no visitor is ever on it.
- **The admin app gets a "Site" area** for cloud tenants: Theme, Wording, SEO, Domain. Built from the schema.
  A custom tenant like Aspen never sees it.
- Publishing content and publishing placements stay separate actions with separate status, as now.
- Published versions are kept, so "go back to the previous version" is repointing the host entry.

**As built:**

- The area is one screen, "Look and wording". It lists the site's pages and, under "Whole site", the
  template, colours and fonts, name and footer, social links and search results. Each page shows its
  sections in the order they appear, and a preview of the draft sits beside them with the open section
  outlined. Chosen on 2026-11-23 from three mock-ups (https://claude.ai/artifact/YCDD6h4vPRgxb2YJXw9RzX).
- The draft saves itself about a second after typing stops, because the preview shows the saved draft.
  There is no "Save draft" button; Publish is the only one.
- A preview page may be framed by the admin app and nowhere else, offers no form, and keeps links to the
  site's other pages inside the preview.
- Not built: going back to an earlier version.

### 9. Email and forms

- One sending domain for the platform (`send.{brand}`), verified once in Resend.
  From: `"{Site name}" <{tenant}@send.{brand}>`. Reply-To: the owner's verified contact email.
- The contact email is verified by a code before anything is sent to it.
- A daily cap per tenant on outgoing mail, enforced in Elysian, well under Resend's own limit.
- Templates are fixed; owners edit wording only.
- **Turnstile:** one widget covers the brand domain and all its subdomains. Each own domain needs adding as a
  hostname; the free plan allows 10 hostnames per widget and 20 widgets. The site key and secret are already
  per-tenant settings, so a tenant can be moved to another widget without a deploy.
- Form endpoints get a coarse Cloudflare rate-limit rule, because the in-memory limiters multiply with
  instances (parent plan, review finding 8).

**As built:** the sending domain is `send.framenice.com`; the daily cap is 200 messages a tenant; cloud
sites share one Turnstile widget, whose secret is `Turnstile:CloudSecretKey`. Phone is required on both
forms. Booking mail falls back to the confirmed contact email. Not done: the Cloudflare rate-limit rule.

### 10. Platform admin screens

Visible only to a platform admin, at `/platform` in the admin app:

- Tenants: list with status, template, modules and primary host; create (name, identifier, owner email);
  suspend and restore.
- Modules per tenant, with the billing reference.
- Domains per tenant: attach, make primary, remove.
- Edge clients: create, rotate, retire the previous key.

Creating a tenant becomes one action that does, in order: tenant row and included modules, the template's
site manifest, default content, tenant settings, placements published, content published, host entry
written, owner invite sent. Each step is safe to run again, so a failure partway is finished by retrying.

**As built:** the Sites screen lists every site and creates one (with a template chosen from a list), and
a site's panel has its status, the Booking add-on, its addresses, a copy to download and delete. Creating a
site makes the tenant, its modules, its address and its owner's invite in one save, then queues its
placements; the invite is a code shown once, not an email. Not built: an edge-clients screen (they are
still made with SQL), billing references in the screen, and a storage quota.

**Deleting a site** (step 14) is for a suspended site drawn with a template, with its name typed again.
The site is marked as being deleted and stops answering at once; a queued job then removes what the edge
holds, its files and their cached copies, and every row it has, the tenant's own last. The job refuses any
site not marked as being deleted. Rows come out of every table row-level security protects, so a table
added later is covered. The copy is one JSON document with a day-long signed link to each uploaded photo;
bookings and visitors' messages are not in it, because they are in the owner's calendar and inbox.

**A deleted site is kept for 14 days** (Elysian 0.0.81; `PlatformDeletion:GraceDays`, 0 to 90, 0 for none).
Deleting marks the site and takes it off the web at once, and records the day its photos and data go
(`TenantInfo.DeleteAfter`). Nothing is removed before that day, and until then "Bring the site back" in its
panel returns it whole, suspended. A daily timer queues the removal of every site whose day has come, and
queues it again each day until the site is gone, so a removal that failed partway finishes by itself. The
job refuses a site that can still be brought back. "Remove everything now" skips the wait, for test sites.
The identifier stays taken until the site is gone.

### 11. What Phase 5 does not include

Self-serve signup and payment. Customer-owned domains through Cloudflare for SaaS. Tooling to move a cloud
tenant to a custom site. Per-platform branding of the admin app. Each is left possible by the model, and
none is needed for the first tenants. (A second template was on this list and has since been built, as
step 15.)

## Built after the first pass (Elysian 0.0.82)

- **Logo.** An owner uploads a PNG, JPEG or WebP (never SVG, up to 2 MB) under "Name, logo and footer".
  Elysian draws it again as two lossless WebP files, at most 160 px tall and half that, and never serves
  the upload itself. They are `placements/{tenant}/logo-{version}-{height}.webp`: a new upload is a new
  name, so a file never changes, the draft can show a new logo while visitors keep the old one, and going
  back to an earlier version brings its logo back. The content document carries which upload and its size,
  so the header knows the image's width and height and never moves. The logo takes the place of the name;
  the name is its alt text and stays in titles. Saving the draft never changes the logo: only uploading or
  removing does.
- **Each page's own search words.** Portfolio, About, Investment, Booking, Contact and Policies each have a
  "Search results" part with a title and a description. Empty, a page uses its heading with the site's name,
  and the site's description. They are ordinary fields in the template's schema.
- **Share image.** A reserved slot, `share-image` (1200 by 630), picked like any other spot under "Whole
  site". Every page names it as `og:image`, with its size, `og:url` and a large Twitter card. Like every
  slot it is never empty. A site made before the slot existed needs its placements republished once.
- **Going back.** "Earlier versions" lists what has been published. Going back to one makes it the draft;
  visitors see nothing until it is published, which is a new version. Only a version made with the
  template the site is on now can be gone back to.
- **Forms are limited at the edge.** The cloud Worker counts messages and bookings per visitor per site
  with a Workers rate limit binding (ten a minute, per Cloudflare location) and answers 429 without asking
  the backend. It is in the Worker and not a dashboard rule so that it covers own domains, which are each
  their own zone. It lets a form through when the counter can't be reached. The backend's own limit stays.
- **Storage limit.** A cloud site may hold 25 GB of uploaded photos (`PlatformStorage:DefaultQuotaGb`), or
  a limit of its own set from the Sites screen (`TenantInfo.StorageQuotaGb`). What counts is the uploaded
  files at the size they were uploaded. An upload that would go over is refused before anything is
  recorded. The Photos screen says how much is used and warns from nine tenths. A site with its own code
  has no limit.

## Measuring speed

Aspen's site reports LCP, CLS and INP to GA4. **Recommended:** the template sends the same three numbers to
one platform-owned property with the tenant as a dimension, and nothing else: no page content, no visitor
identifiers. An owner's own analytics id can be a content field later. Phase 5 is not done on a tenant
until its home page LCP p75 is at or under Aspen's.

**As built:** not GA4. Each page carries one small script of the template's own that reports the three
numbers to the site's own Worker (`/api/vitals`), which keeps them in a Workers Analytics Engine dataset
(`site_vitals`) by site, template, kind of page and kind of device: no cookie, no address, nothing about
the visitor. `npm run vitals -w @robsmitha/cloud-photography` prints the 75th percentiles; it needs a
token with Account Analytics: Read. No reading has been taken yet.

## Build order

| Step | Work | Where | Needs from you | Status |
|---|---|---|---|---|
| 1 | Contact and booking components into the library, to the rules in decision 4. Library tests. | `packages/ui` | Tag a `ui-v*` release | Done, as shared rules and wording rather than components (decision 4) |
| 2 | Tenant model: `TemplateKey`, `TemplateVersion`, `ContentVersion`; `TenantDomain`; expand-only migration | Elysian | Run the migration; tag a release | Done |
| 3 | Site content: schema registry, draft and published storage, validation (lengths, contrast, links), preview token | Elysian | | Done |
| 4 | Edge store: `IEdgeConfigStore` over Cloudflare KV; `PublishSiteContentCommand`; host map written from `TenantDomain` | Elysian | Create the KV namespace and a token limited to it; store the token in Key Vault | Done |
| 5 | Shared images Worker at `images.smithadigital.com` | `elysian-platform/images` | Approve the Worker and its domain; a purge token for that zone | Done 2026-11-23 |
| 6 | The `classic@1` template: pages, prerender, web vitals. Its `template.schema.json` is written. | `elysian-platform/templates/photography/classic` | Look chosen (option B) | Done |
| 7 | The `cloud-photography` Worker: host lookup, injection, caching, preview, suspended and unknown hosts | `elysian-platform/cloud-photography` | A platform-scope edge client (SQL); approve the Worker on `workers.dev` | Done |
| 8 | Admin app "Site" area: theme, wording, SEO, preview, publish | `elysian-platform/admin` | | Done; rebuilt page by page with a preview 2026-11-23 |
| 9 | Platform screens and the one-step tenant creation | `elysian-platform/admin`, Elysian | | Done, bar the edge-clients screen |
| 10 | Email: sending identity per tenant, contact email verification, daily cap | Elysian | Verify `send.{brand}` in Resend | Done |
| 11 | `framenice.com`: wildcard record and route; Turnstile widget | Cloudflare | Approve the record and the route | Done 2026-11-23 |
| 12 | First tenant, end to end, from the admin app only | | Be the first owner, or name one | Not yet: test sites only |
| 13 | Own domains: `AttachTenantDomainCommand` and the Domain screen | Elysian, admin | A Cloudflare token allowed to attach Worker domains | By hand only; proven 2026-11-23 |
| 14 | Leaving: export and delete a tenant (rows, blob prefixes, KV entries, domains) | Elysian | Before the first tenant who isn't a friend | Done 2026-11-23 |
| 15 | The `gallery@1` template, a template picker in the Site area, and the change-of-template operation | `elysian-platform/templates/photography/gallery`, admin, Elysian | After the first tenant is live on classic | Done 2026-11-23 |

Steps 1, 2 and 5 are independent and can start together. Step 6 needs 1. Step 7 needs 4 and 6. Nothing
before step 11 needs the brand domain, and nothing in this phase changes `www.aspensmitha.com`.

**Also in this phase, small and separate:** the deploy hook Phase 4 promised. After Aspen's site deploys,
its workflow tells Elysian, which fetches `/_site/manifest.json` from her stored primary host and stores it.
That retires `scripts/elysian-seed-aspen-site-manifest.sql`, which had to be regenerated and rerun by hand
when the session address was added. It needs `TenantDomain` (step 2), so it follows that step. Not built yet.

## What is left

1. **Own domains from the admin** (step 13), after the token is agreed. By hand works today.
2. **The first real tenant** (step 12), and before it: a first speed reading. How speed is measured,
   keeping unpublished sites out of search results, a sitemap and a grace period on delete are all built.
3. The smaller items under "Where it stands".

## Risks and open questions

- **One Worker serves everyone, so one bad deploy breaks everyone.** Template versions deploy side by side
  and tenants are pinned, but the Worker's own code is shared. It needs tests for the injection and escaping
  rules, a deploy to `workers.dev` first, and a one-command rollback to the previous version.
- **Tenant content on a shared domain.** Every rule in decision 5 about escaping exists because one tenant's
  wording is served from the same origin family as another's. No cookies are set on the brand domain at all,
  and the admin app stays on a different registrable domain.
- **Images share a registrable domain with the admin app.** `images.smithadigital.com` serves only
  re-encoded WebP with a fixed content type. If that ever needs to carry anything a browser could run, it
  moves to the brand domain first.
- **KV is eventually consistent.** A publish can take up to a minute to be seen everywhere. The admin app
  should say "live within a minute", not "live now", and the previous version keeps serving until then.
- **Cloudflare tokens with write access now live in Azure.** The KV token and, from step 13, the
  domain-attach token. Each is limited to exactly one job, kept in Key Vault, and never in a repo or the
  frontend. The domain-attach token is the most powerful thing in the system and is why own domains are a
  late step.
- **Database size.** `elysian-prod` is on the Basic tier with a 2 GB cap. Photo metadata is small, but watch
  it as tenants arrive (parent plan, review finding 7).
- **Storage per tenant.** Originals are large. A quota per tenant belongs with step 9; the number is yours
  to set.
- **Booking as an add-on.** Each tenant with Booking connects their own Google Calendar, which the
  Integrations page already handles. The Google OAuth client is shared, and whether one client can serve
  many unrelated calendar owners without Google's app verification is not yet checked.
- **Story hero in the snapshot** (decision 5) means publishing a story also republishes content. That
  coupling is worth it for the preload, but it is the first thing to drop if it complicates step 4.
