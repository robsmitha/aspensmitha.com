# Phase 5: cloud-photography

Status: written 2026-11-22. Decisions 2, 3 and 4 were agreed the same day, and the brand domain is
`framenice.com`, bought through Cloudflare Registrar. Step 1 is under way; nothing else is built.
Parent plan: `elysian-sites-platform.md`. Other recommendations are marked **Recommended** and become
decisions when you agree them.

## Goal

A photographer gets a working site without a repo, a build or any change in Azure. An operator (later, a
signup page) creates the tenant; the owner signs in to `manage.smithadigital.com`, uploads photos, picks
colours and wording, and publishes. One Worker, `cloud-photography`, serves every such site.

Done when: a new tenant goes live at `{tenant}.{brand domain}` from the admin app alone, its home page's
largest image is on screen without any call to the Function App, and nobody touched Azure or Cloudflare by
hand to make it happen.

## What exists today

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

**Not built:**

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

### 2. One template first: `classic@1`, a restyled version of the structure Aspen's site already proves

**Recommended.** Pages: Home, Portfolio, a gallery per category, a story page, About, Contact; Investment
and Booking when the tenant has the Booking module. It is a Vue app in `elysian-platform/templates/photography`,
prerendered at build time, built on `packages/ui`.

- The template owns the list of categories on offer. An owner switches categories on or off and renames them;
  the slug is fixed, because it is in public addresses and storage paths.
- The template owns the slot catalogue. Every cloud tenant on `classic@1` has the same slots, ratios and
  widths, so the page knows every reserved image's address and size with no call.
- A second template is a later decision. Nothing here assumes there is only one: the tenant row carries
  `TemplateKey` and `TemplateVersion`, and the Worker serves the build that matches.

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

### 11. What Phase 5 does not include

Self-serve signup and payment. Customer-owned domains through Cloudflare for SaaS. Tooling to move a cloud
tenant to a custom site. A second template. Per-platform branding of the admin app. Each is left possible
by the model, and none is needed for the first tenants.

## Measuring speed

Aspen's site reports LCP, CLS and INP to GA4. **Recommended:** the template sends the same three numbers to
one platform-owned property with the tenant as a dimension, and nothing else: no page content, no visitor
identifiers. An owner's own analytics id can be a content field later. Phase 5 is not done on a tenant
until its home page LCP p75 is at or under Aspen's.

## Build order

| Step | Work | Where | Needs from you |
|---|---|---|---|
| 1 | Contact and booking components into the library, to the rules in decision 4. Library tests. | `packages/ui` | Tag a `ui-v*` release |
| 2 | Tenant model: `TemplateKey`, `TemplateVersion`, `ContentVersion`; `TenantDomain`; expand-only migration | Elysian | Run the migration; tag a release |
| 3 | Site content: schema registry, draft and published storage, validation (lengths, contrast, links), preview token | Elysian | |
| 4 | Edge store: `IEdgeConfigStore` over Cloudflare KV; `PublishSiteContentCommand`; host map written from `TenantDomain` | Elysian | Create the KV namespace and a token limited to it; store the token in Key Vault |
| 5 | Shared images Worker at `images.smithadigital.com` | `elysian-platform/images` | Approve the Worker and its domain; a purge token for that zone |
| 6 | The `classic@1` template: pages, `template.schema.json`, prerender, web vitals | `elysian-platform/templates/photography` | Review the design before it is built out (three options as an artifact, as with the admin) |
| 7 | The `cloud-photography` Worker: host lookup, injection, caching, preview, suspended and unknown hosts | `elysian-platform/cloud-photography` | A platform-scope edge client (SQL); approve the Worker on `workers.dev` |
| 8 | Admin app "Site" area: theme, wording, SEO, preview, publish | `elysian-platform/admin` | |
| 9 | Platform screens and the one-step tenant creation | `elysian-platform/admin`, Elysian | |
| 10 | Email: sending identity per tenant, contact email verification, daily cap | Elysian | Verify `send.{brand}` in Resend |
| 11 | `framenice.com`: wildcard record and route; Turnstile widget | Cloudflare | Approve the record and the route |
| 12 | First tenant, end to end, from the admin app only | | Be the first owner, or name one |
| 13 | Own domains: `AttachTenantDomainCommand` and the Domain screen | Elysian, admin | A Cloudflare token allowed to attach Worker domains |
| 14 | Leaving: export and delete a tenant (rows, blob prefixes, KV entries, domains) | Elysian | Before the first tenant who isn't a friend |

Steps 1, 2 and 5 are independent and can start together. Step 6 needs 1. Step 7 needs 4 and 6. Nothing
before step 11 needs the brand domain, and nothing in this phase changes `www.aspensmitha.com`.

**Also in this phase, small and separate:** the deploy hook Phase 4 promised. After Aspen's site deploys,
its workflow tells Elysian, which fetches `/_site/manifest.json` from her stored primary host and stores it.
That retires `scripts/elysian-seed-aspen-site-manifest.sql`, which had to be regenerated and rerun by hand
when the session address was added. It needs `TenantDomain` (step 2), so it follows that step.

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
