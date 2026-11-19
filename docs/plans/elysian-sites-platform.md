# Elysian Sites: shared multitenant platform

Status: draft 2, design only. Nothing in this repo, in Elysian or in Azure has been changed.
Visual overview: https://claude.ai/artifact/LeEQ6FtGBcE5dqXGpXhJyV
Last reviewed: 2026-11-16

The umbrella domain is `smithadigital.com`: the admin app is `manage.smithadigital.com` and the shared images host is `images.smithadigital.com`. `framenice.com` is a placeholder for the photography platform's domain (not bought yet) and `shop.example` for the shop platform's.

## 1. Goal

Stop paying for a Static Web App and a Function App per site. Run every site on one Function App, one SQL database, one storage account, one admin app and one sign-in, and serve the public sites from Cloudflare Workers.

Today each site costs about $10 a month, almost all of it the SWA Standard plan (~$9). On the shared platform an extra tenant costs about $0, plus their domain at cost.

## 2. Model

Every tenant has two independent settings.

| Setting | Values | Meaning |
|---|---|---|
| **Platform** | `photography`, `shop` (later), `personal` | The product line: brand, cloud template, modules on offer |
| **Runtime** | `cloud`, `custom` | Which code renders the public site |

| Platform | Cloud runtime | Custom runtime |
|---|---|---|
| Photography | `cloud-photography` Worker, all cloud photographers | `site-aspensmitha` (aspensmitha.com) |
| Shop (later) | `cloud-shop` Worker | `site-{store}` |
| Personal | none | `site-robsmitha` (robsmitha.com) |

- **Cloud tenant:** no repo. The owner picks colors and edits wording in the admin app. One cloud Worker per platform serves all of them.
- **Custom tenant:** its own repo and its own Worker. A push to that repo deploys only that site.
- **Upgrade:** cloud to custom changes the runtime and moves the domain to the new Worker. Data, logins and platform stay.

### Modules

A module is a group of Elysian features a tenant either has or doesn't. A platform's included modules are switched on when the tenant is created; add-ons when they're bought.

| Module | Photography | Shop | robsmitha.com |
|---|---|---|---|
| Core: site content, CMS, contact form, users | Included | Included | Included |
| Photos, placements, stories | Included | Included (product images) | Off |
| Booking | Add-on | Off | Off |
| Instagram | Add-on | Add-on | Off |
| Commerce: products, inventory, orders, checkout | Off | Included | Off |
| Finance, Assistant, Congress, Code | Off | Off | On, this tenant only |

Enforcement lives in Elysian: a `TenantModule` table (tenant, module, status, billing reference) and a `[RequiresModule(Modules.X)]` MediatR behavior next to `[Authorize]`. It rejects the request before any handler or external call runs.

**Startup rule:** the host always calls every `Add…Features`. Registration only binds options. A missing setting fails the request that needs it, with a named error, and never the host. A test builds the host with empty configuration and resolves every handler.

## 3. Topology

```
Browser ── friend.com ───────────► cloud-photography Worker ─┐
Browser ── www.aspensmitha.com ──► site-aspensmitha Worker ──┤
Browser ── robsmitha.com ────────► site-robsmitha Worker ────┼─ /api/* ─► elysian-sites (Azure Functions, Flex)
Owner ── manage.smithadigital.com ► admin Worker ─────────┘                 │
                                        │                                      ├─► elysian-prod SQL
                              KV: host map + manifests ◄── publish ────────────┤
                                                                               └─► smithaconsultingprod blobs/queues
Images: images.smithadigital.com (Worker over blob) and images.aspensmitha.com (unchanged)
Sign-in: Entra External ID
```

Rules:
- Every `/api/*` call reaches Azure through a Worker. The browser never chooses its tenant.
- No public page waits on the Function App. HTML, theme, wording and the hero preload come from the edge.
- The Function App accepts traffic only from Cloudflare, and only with a valid edge credential (section 7).

## 4. Request paths

**Cloud tenant (`friend.com/`)**
1. `cloud-photography` looks up the host in KV: `{ tenant, platform, runtime, manifestVersion }`. It answers 404 if the platform isn't its own. Cached in isolate memory for 60 s.
2. It reads `manifest:{tenant}:{version}` from KV: theme tokens, wording, SEO fields, hero slot, active modules.
3. It streams the prerendered template HTML through `HTMLRewriter`, injecting title, OG tags, a `:root{…}` style block, the hero `<link rel=preload>` and the wording as inline JSON. All injected text is escaped.
4. The response is edge-cached by host and manifest version. Republishing bumps the version, so there is no purge.
5. JS, CSS and fonts are static assets shared by every cloud tenant, cached forever.

**Custom tenant (`aspensmitha.com/`)**
1. HTML, JS and CSS are served directly from the Worker's static assets. The Worker doesn't run for them.
2. Pages stay prerendered at build time by the `seoPages` plugin.
3. Placement images load from fixed CDN URLs, as now.
4. Only `/api/*` runs the Worker (`run_worker_first`). `@elysian/site-edge` strips client tenant headers, sets the tenant from its own config, adds its edge credential and forwards.

## 5. CMS publishing (cloud tenants)

Same pattern as placements: write everything, then switch.

1. The owner edits and clicks Publish in the admin app.
2. `PublishSiteManifestCommand` validates against `template.schema.json` for the tenant's pinned template version: allowed fields, lengths, color contrast (WCAG AA).
3. It writes `manifest:{tenant}:{n+1}` to KV, then repoints the host entries to the new version.
4. New HTML is served within the 60 s host-map TTL.

Failure modes:
- KV write fails partway: the previous version keeps serving; the admin app offers a retry.
- Manifest missing or invalid at the edge: the Worker renders template defaults and logs. A cloud site is never blank.
- Function App cold or down: public pages are unaffected. Only editing and forms wait.
- Breaking template change: tenants are pinned (`classic@1`). `classic@2` deploys alongside and tenants move one at a time.

## 6. Domains

Tenant domains are bought through Cloudflare Registrar in the operator's account and attached to a Worker as custom domains. Bare domains work and certificates are automatic.

| Tenant | Default address | Own domain |
|---|---|---|
| Cloud | `{tenant}.framenice.com` | Optional. Attached to the platform's cloud Worker by `AttachTenantDomainCommand`. |
| Custom | `site-{tenant}.workers.dev` (testing only) | Expected. Attached in the site's `wrangler.jsonc`. |

- One primary hostname per tenant. Everything else 301-redirects to it.
- The KV host map is the only routing table. An unknown host gets a 404.
- Removing a domain deletes the KV entry first, then the Worker domain.
- The domain sits in the operator's account. If a tenant leaves, it is transferred to them. Put that in the terms.
- Keep the domain model provider-agnostic (`TenantDomain`: host, status, attachment kind) so Cloudflare for SaaS custom hostnames can be added for tenants who keep a domain elsewhere.
- `aspensmitha.com`: registered at GoDaddy, DNS already on Cloudflare. No change needed.
- `robsmitha.com`: registered and hosted at GoDaddy. Its DNS moves to Cloudflare before its cutover.
- `smithadigital.com`: its DNS is already on Cloudflare, so `manage.` and `images.` can attach to Workers with nothing to move.

## 7. Sign-in, tenancy and trust

- **Identity:** Entra External ID proves who the user is. Elysian validates the JWT in middleware that replaces `ClaimsPrincipalMiddleware`.
- **Authorization:** roles come from a `TenantMembership` row (user, tenant, role). Policy names and the `[Authorize]` pipeline are unchanged.
- **Roles:** Site owner and Editor are scoped to one tenant. Platform admin is a separate flag, never granted through a tenant invite.
- **Invites:** an invite code tied to a tenant and role. Redeeming it creates the membership.
- **Signup is invite-only for now, built so self-serve can be added without a redesign:**
  - Tenant creation is one command, `CreateTenantCommand`, with no manual operator step. An invite code is only a gate in front of it. Self-serve later puts a signup page and payment in front of the same command.
  - Anyone can create an account in External ID. An account without a membership can do nothing until it redeems a code. Access never depends on the operator adding a user to the directory.
  - Tenant identifiers are validated, unique and checked against a reserved list (`www`, `manage`, `images`, `send`, `api`, `admin`) from day one, because they become subdomains.
  - Tenants carry a `Status` (Trial, Active, Suspended) and a plan, and `TenantModule` already has a billing reference, so subscriptions attach later without a schema change.
  - Storage and email quotas are enforced per tenant from the start.
  - Terms acceptance is recorded per owner.
  - `TenantDomain` can hold a customer-owned domain through Cloudflare for SaaS, which self-serve customers will expect.
- **Tenants run their own sites.** The admin app is each owner's CMS. The operator is needed only for platform-level work.
- **One admin app for every platform, at `manage.smithadigital.com`.** One codebase, one Worker, one sign-in redirect URI. It shows the screens and branding for the tenant's platform after sign-in. It is deliberately on a different registrable domain from tenant sites (`{tenant}.framenice.com`), so tenant-controlled content can never reach the admin app's session. A platform may have a friendly link such as `framenice.com/login` that redirects there.

### Edge credentials (changed in review)

Each Worker has its **own** credential, and Elysian knows what that credential may act for:

| Edge client | May set tenant to |
|---|---|
| `site-aspensmitha` | `aspensmitha` only |
| `site-robsmitha` | `robsmitha` only |
| `cloud-photography` | any tenant with platform `photography` and runtime `cloud` |
| `admin` | any tenant, and only where the signed-in user has a membership |

Elysian's tenant strategy accepts `X-Tenant` only with a valid credential whose scope covers that tenant. Credentials live in Worker secrets and Key Vault and can be rotated one Worker at a time. The Function App also restricts inbound traffic to Cloudflare IP ranges, but that alone proves nothing, because any Cloudflare customer's Worker shares those ranges.

### Data isolation: two layers (decided 2026-11-16)

1. **Application layer:** Finbuckle query filters on every tenant entity, as today.
2. **Database layer:** SQL row-level security on **every** tenant table. Azure SQL Database supports it on all tiers, including Basic.

How it works:
- A security policy per tenant table, generated from the EF model for every `IsMultiTenant()` entity, with a filter predicate and a block predicate comparing `TenantId` to `SESSION_CONTEXT(N'TenantId')`.
- A connection interceptor in Elysian sets the session context each time a connection opens.
- Cross-tenant platform work (tenant creation, the per-tenant queue fan-out, "which tenants does this user belong to" at sign-in) runs through one named bypass path that is easy to audit.
- The tenant store and shared reference tables are excluded.

Rollout, because the live hosts on Elysian 0.0.50 and 0.0.61 never set the session context:
- **Lenient first (phase 1):** a connection with no tenant set sees all rows, so the old hosts keep working. `elysian-sites` always sets it and is protected from day one.
- **Strict after each old host is retired:** photography tables after phase 3, finance tables after phase 6. From then on an undeclared connection sees nothing.

Guards that go with it: a test that fails when an entity is neither multitenant nor on an explicit allowlist, a test that every multitenant table has a policy, and a rule against `IgnoreQueryFilters` and tenant-less raw SQL outside the bypass path.

### Tenant selection in the admin app (changed in review)

On public sites the tenant comes from the hostname. The admin app serves every tenant from one host, so there the signed-in user picks a tenant, the admin Worker sends it, and Elysian accepts it only if the user has a membership in that tenant. Platform-admin access to a tenant is written to an audit log.

## 8. Email

One Resend sending domain per platform for cloud tenants (`send.framenice.com`), verified once.

| Header | Cloud tenant | Custom tenant (optional own domain) |
|---|---|---|
| From | `"Friend Photography" <friend@send.framenice.com>` | e.g. an address on `booking.aspensmitha.com` |
| Reply-To | The owner's verified contact email | Same |

Guardrails in Elysian: Reply-To verified by code before anything is sent; the local part is the tenant identifier and not editable; a daily quota per tenant; fixed templates with editable wording; bounces and complaints logged by tenant through a Resend webhook.

Resend Free: 3,000 emails a month, 100 a day, 3 domains. Pro ($20/mo): 50,000 emails, no daily cap, 10 domains. The Free slots go to `send.framenice.com`, `booking.aspensmitha.com` and later `send.shop.example`.

## 9. Repos and pipelines

| Repo | Contains | A push to `main` deploys |
|---|---|---|
| `Elysian` | All business logic | NuGet package on a `v*.*.*` tag (unchanged) |
| `elysian-platform` (new) | `functions/` (both current `server/` hosts, merged), `templates/photography/`, later `templates/shop/`, `admin/`, `packages/site-edge`, `packages/ui` | Function App, cloud Workers, admin Worker, npm packages. Path-filtered. |
| `aspensmitha.com` | `clientapp/` only | `wrangler deploy` of `site-aspensmitha` |
| `robsmitha.com` | `clientapp/` only | `wrangler deploy` of `site-robsmitha` |
| New custom sites | Created from `elysian-site-starter` | `wrangler deploy` of `site-{tenant}` |

Each custom site has its own Worker because a Worker's static assets deploy as one unit. A shared bundle would make every push rebuild every site.

A custom site ships its placement catalogue as a public file, `/_site/placement-slots.json`. After a deploy, the workflow notifies Elysian, which fetches the file from the tenant's **stored** primary domain (never a URL from the request) and queues a placement publish if slots changed.

## 10. Infrastructure

**Created once**
- Cloudflare: Workers Paid ($5/mo); the `smithadigital.com` zone (admin and images hosts); a brand zone per platform (tenant content and email only); one cloud Worker per platform; `admin` Worker; `images` Worker; KV namespace `SITES`; scoped API tokens (Workers deploy for GitHub; KV write and Worker-domain attach for the Function App).
- Azure: Function App `elysian-sites` (Flex Consumption) with deployment storage and Application Insights; user-assigned identity `elysian-sites-id` (no account keys in settings); Key Vault `elysian-sites-kv`; Entra External ID tenant and one app registration; inbound access restrictions.
- Resend: one sending domain per platform.
- GitHub: `elysian-platform`, the `@elysian` npm scope, `elysian-site-starter`.

**Per custom tenant:** one repo, one `site-{tenant}` Worker, one domain.
**Per cloud tenant:** nothing. SQL rows, a KV entry, optionally a domain.
**Per new platform:** one cloud Worker, a brand domain, a sending domain. No Azure resources.

**Kept:** `elysian-prod-db`, `smithaconsultingprod` storage and `images.aspensmitha.com`, the `aspensmitha.com` zone (Resend records on `booking.` untouched).

**Retired after each cutover is verified:** both Static Web Apps (~$9/mo each), both current Function Apps with their plans, deployment storage and managed identities.

## 11. Elysian changes

| Area | Change |
|---|---|
| Tenant model | `Platform`, `Runtime`, `TemplateKey`, `TemplateVersion`, `ManifestVersion` on `ElysianTenantInfo`; a `TenantDomain` entity |
| Platforms and modules | `PlatformDefinition` registry in code, `TenantModule` table, `[RequiresModule]` behavior |
| Tenant settings | Per-site app settings (`Resend__*`, `Booking__*`, `Turnstile__SecretKey`, `PlacementPublishing__PublicBaseUrl`, `GoogleCalendar__*`, Instagram) move to a `TenantSettings` table, secrets to Key Vault. Booking rules become per tenant, not a host singleton. |
| Tenant strategy | Edge-client credentials with a tenant scope (section 7) |
| Data isolation | Row-level security policies generated for every tenant table, a session-context connection interceptor, a named bypass path, lenient and strict modes (section 7) |
| Auth | JWT middleware, `TenantMembership`, invite codes, role lookup per tenant in `IdentityService` |
| Site content | `Features/SiteContent`: schema registry, theme and page commands, `PublishSiteManifestCommand`, `IEdgeConfigStore` over the Cloudflare KV API |
| Placements | `PlacementCatalog` loaded per tenant |
| Background jobs | A timer enqueues **one queue message per tenant** with the module active; a queue-triggered function does the work. Replaces the `TenantIdentifier` setting. |
| Email | Per-tenant From and Reply-To, contact-email verification, daily quota, bounce webhook |
| Provisioning | `CreateTenantCommand`, `AttachTenantDomainCommand` |
| Tenant lifecycle | `SuspendTenantCommand`, `ExportTenantCommand`, `DeleteTenantCommand` (SQL rows, blob prefixes, KV entries, domains) |
| One host | robsmitha's Plaid, assistant, Congress and code functions move into the shared host; both sites converge on one Elysian version |

## 12. robsmitha.com

A custom tenant on the Personal platform. Its API merges into `elysian-sites`.

- **DNS first.** Move the zone from GoDaddy to Cloudflare as a separate step with no app change: copy every record including MX and TXT, keep the SWA records DNS-only, switch nameservers, confirm site and mail.
- **Users must be relinked.** Plaid items, budgets and saved bills hang off `User` rows found by `ExternalUserId`, which changes with the sign-in provider. `IdentityService` relinks by email only for active managed users. Run the membership backfill first, so each admin has a membership keyed by email. Their first sign-in with the new provider then claims it and moves their existing user and data across. Test with a second account.
- **Plaid webhook.** URL unchanged (`/api/PlaidWebhook?tenant=robsmitha`). The Worker forwards the raw body and `Plaid-Verification` header untouched and requires no session on that route.
- **OAuth return paths** (`/plaid-oauth`, `/oauth`) keep their paths, so Plaid and GitHub settings don't change.
- **Route protection** moves from SWA `allowedRoles` to the SPA route guard. The API's policies protect the data, as now.
- **Containment.** Finance modules are on for this tenant only. Plaid tokens stay encrypted with `TokenEncryptionKey`. Alert on any finance-module call from another tenant. See review finding 4.

## 13. Staying live during the build

The platform is built next to the live sites. Each site moves only at its own cutover, and each cutover can be undone in seconds.

| Risk | Rule |
|---|---|
| Elysian upgrades | Live sites stay pinned. New behavior is opt-in: the SWA header strategy and `ClaimsPrincipalMiddleware` stay supported; membership roles only when `Auth:RoleSource=Membership`; tenant settings fall back to app settings. |
| Shared SQL | Expand-only migrations: new tables, nullable or defaulted columns. No renames, drops or new `NOT NULL` until no running host reads the old shape. Idempotent backfill scripts. Note the restore point before each migration. Row-level security starts lenient, so hosts that don't set a tenant on the connection keep working. |
| Background triggers | `elysian-sites` deploys with every timer, queue and blob trigger disabled. At cutover they move in one step: on in the new app, off in the old. |
| Storage and images | New containers and prefixes only. `photos/`, `placements/aspensmitha/` and `images.aspensmitha.com` don't change. |
| DNS cutover | Test on `workers.dev`. The cutover is one record change and rollback is reverting it. Old SWA and Function App stay deployed for 14 days. |

**Check now:** neither Function App has a `TenantIdentifier` app setting, and timers without a tenant throw when it's missing. Unless it's supplied elsewhere, `SyncInstagramPosts`, `RefreshInstagramToken`, `CheckGoogleCalendarHealth`, `NightlyPlaidSync` and `CongressRefreshTrackedBills` may be failing today. Look in Application Insights.

## 14. Rollout

Sign-in comes before the first cutover. Leaving Static Web Apps removes its built-in login, and the shared
backend only accepts sign-in tokens, so Aspen's admin pages must already work with the new sign-in on the day
her `www` record moves.

| Phase | Work | Done when |
|---|---|---|
| 1. Shared backend | `elysian-platform` repo with both hosts merged; platforms, modules, tenant settings, edge credentials, memberships; row-level security on all tenant tables in lenient mode; deploy `elysian-sites` with triggers off | It serves a test tenant end to end while both live sites run unchanged |
| 2. Sign-in ready | Entra External ID tenant and app registration; Aspen's admin pages sign in with it; memberships backfilled from her existing admins; `@elysian/site-edge` and `wrangler.jsonc` in her `clientapp/` | Aspen signs in and manages her site on the `workers.dev` test URL, against `elysian-sites`, while the live site is untouched |
| 3. aspensmitha.com cutover | SWA redirects ported; move `www` to the Worker; triggers handed over | GA4 LCP p75 equal or better for 14 days. Then retire its SWA and Function App, and switch the photography tables to strict row-level security. |
| 4. Shared admin app | Extract the admin views into `admin/` at `manage.smithadigital.com`; site picker; invite codes in the UI | Aspen manages her site from `manage.smithadigital.com` |
| 5. cloud-photography | `templates/photography`; site content and manifest publishing; tenant creation and domain attach | A new tenant goes live without anyone touching Azure |
| 6. robsmitha.com | DNS move; membership backfill; `site-robsmitha`; triggers handed over | Nightly sync and webhooks clean for 14 days. Then retire its SWA and Function App, and switch the finance tables to strict row-level security. |
| 7. cloud-shop | Shop definition, Commerce module with checkout, `templates/shop`, brand and sending domains | A shop tenant goes live with no new Azure resources |

## 15. Decisions

| Question | Decision |
|---|---|
| Tenant domains | Bought in Cloudflare Registrar, attached as Worker custom domains |
| Images host | One shared Worker at `images.smithadigital.com`. Aspen keeps hers. |
| robsmitha.com's API | Merged into `elysian-sites` |
| Custom sites | One Worker each. Workers for Platforms if they reach the dozens. |
| Cloud to custom | Supported |
| More platforms | Supported: platform and runtime are separate tenant settings |
| Admin app | One app for every platform at `manage.smithadigital.com`, off the tenant domains |
| Signup | Invite-only for now. Built so self-serve can be added without a redesign (section 7). |
| Photography domain | `framenice.com` as a placeholder. Not bought. Confirm before phase 5. |
| Data isolation | Row-level security on all tenant tables: lenient first, strict after each old host is retired |

Still open: the photography platform's final name and domain (before phase 5); for Shop only, its name, the payment provider (one that pays store owners directly, such as Stripe Connect); how Shop prices and stock reach the edge (leaning: catalogue published to KV, stock checked through the API at checkout).

## 16. Architecture review (2026-11-16)

Reviewed against common practice for a shared-schema multitenant SaaS serving several business domains from one backend.

### Holds up

- **Tenant as a row, shared schema, global query filters.** Standard at this scale. Checked in Elysian: 33 of 39 entity configurations call `IsMultiTenant()`; the other six are the tenant root (`Merchant`), four reference tables and a base class.
- **Identity from the IdP, authorization from the database.** Standard.
- **Entitlements checked per request** (`TenantModule`), not by what the host registered. Standard, and what makes one backend for several domains workable.
- **Config published to the edge, immutable versions, pointer switch.** Standard for keeping origin off the render path.
- **Expand-only migrations and triggers handed over in one step.** Standard for a live migration.
- **In-memory cache is tenant-keyed.** `PortfolioCache` keys by `{scope}:{tenant}:{key}`.
- **Blob recovery.** Soft delete is on for blobs and containers (7 days).

### Gaps to close

1. **One shared edge secret would let any holder act as any tenant.** (High. Fixed in section 7.) The earlier draft had a single `X-Edge-Auth` secret in every site Worker and repo. Standard practice is a credential per client with a scope the origin enforces.
2. **Tenant selection on the admin host was undefined.** (High. Fixed in section 7.) "Tenant comes from the hostname" can't apply to one admin host serving every tenant. The tenant is user-selected there and must be authorized by membership on every request.
3. **Tenant sites and the admin app share a registrable domain.** (Medium. Decided: one admin host at `manage.smithadigital.com`, see section 7.) `{tenant}.framenice.com` serves tenant-controlled content next to `manage.framenice.com`. Hosted platforms keep tenant content on a different registrable domain from the app that holds sessions, so a script on a tenant site can never touch app cookies. Recommendation: one admin host for all platforms on a separate operator domain, branded by the tenant's platform after sign-in. That also means one redirect URI in total. Whatever the host: no cookies scoped to a parent domain, and all manifest content escaped at the edge.
4. **Database isolation is application-layer only, and finance data now shares it.** (Medium. Decided: row-level security on all tenant tables, see section 7.) Query filters are the norm, but one `IgnoreQueryFilters()` or raw SQL call leaks across tenants. Add: a test that fails when an entity is neither multitenant nor on an explicit allowlist; a rule against `IgnoreQueryFilters` and tenant-less raw SQL outside provisioning; and SQL row-level security keyed on `SESSION_CONTEXT` for the finance tables as a second layer.
5. **Per-tenant background work must be queued per tenant.** (Medium. Fixed in section 11.) Looping over tenants inside one timer execution lets one slow or failing tenant block the rest and runs into execution timeouts.
6. **No tenant offboarding.** (Medium before paying customers.) A shared database can't restore or remove one tenant with a backup. Export and delete commands are needed (added to section 11).
7. **SQL Basic won't carry a Shop platform.** (Low now.) `elysian-prod` is Basic: 5 DTU, a 2 GB cap, locally redundant backups, 7-day restore. Fine for today's load. Alert at about 70% of size and DTU, and move to Standard or serverless General Purpose before Commerce ships.
8. **Rate limiting is per instance.** (Low.) `ContactRateLimiter` and `BookingRateLimiter` are in-memory and Flex Consumption scales out, so limits multiply with instances. Confirm the partition key includes the tenant, and put a coarse Cloudflare rate-limit rule on the form endpoints.

### Accepted trade-offs

- **Operator-owned tenant domains.** Fine for friends. A public self-serve product normally leaves the domain with the customer and uses Cloudflare for SaaS. The `TenantDomain` model keeps that open.
- **Personal finance data in the shared process.** A product would isolate it. For one owner's own data, with module gating, encrypted tokens, alerting and finding 4, it is a reasonable call.
