# Phase 6: robsmitha.com

Status: written 2026-11-24. Nothing is built or changed yet. This is the plan and the decisions to make
before any code.
Parent plan: `elysian-sites-platform.md` (section 12 and the rollout table).

## Goal

Move robsmitha.com off its own Static Web App and Function App and onto the shared backend
(`elysian-sites`), served by its own Cloudflare Worker, with the same sign-in the admin app uses. When it
has run clean for 14 days, its two Azure resources are retired, and Aspen's old Static Web App with them.

Done when: the nightly bank sync and Plaid webhooks have run clean on the shared backend for 14 days.

## Where it stands

What the site is today (`C:\Users\robsm\Source\repos\robsmitha.com`):

- A Vue app on Azure Static Web Apps, with a Function App (`server/`, Elysian 0.0.61) behind it.
- Sign-in is the Static Web App's own (`/.auth/login/aad`, `/.auth/me`). Ten pages are protected by
  `allowedRoles` in `staticwebapp.config.json`: dashboard, budget, debt, goals, accounts, transactions,
  users, products, saved-bills and plaid-oauth.
- Three background triggers: `NightlyPlaidSync` (09:00 UTC), `SyncPlaidItem` (the `plaid-sync` queue) and
  `CongressRefreshTrackedBills` (every six hours).
- Its DNS is at GoDaddy.

What the shared platform already has, from Phase 1:

- **Every one of its functions.** All of robsmitha.com's HTTP functions and its three triggers are already
  in `elysian-platform/functions`. A name-by-name comparison found none missing.
- **Its triggers, switched off.** `SyncPlaidItem`, `NightlyPlaidSync` and `CongressRefreshTrackedBills` are
  in `disabledBackgroundFunctions` in `infra/main.bicep`, waiting for this cutover.
- **Its platform.** `Personal` exists in Elysian: no shared template, nothing included, any module can be
  switched on per tenant.
- **Module checks.** Requests are held to a module by their feature folder, so a Financial request from a
  tenant without the `finance` module is refused before any handler runs.
- **The Worker pattern.** Aspen's site is the model: a `worker/` folder with `createSiteWorker({ tenant })`
  from `@robsmitha/site-edge`, static assets from `clientapp/dist`, `/api/*` forwarded with the Worker's
  own edge credential.
- **The sign-in pattern.** The admin app signs in with MSAL against the Entra External ID tenant; the
  shared pieces are in `@robsmitha/elysian-ui` (`auth`).

So this phase is mostly a cutover, not a build. The code to write is the site's Worker, the sign-in in its
Vue app, and a change to how its two timers pick tenants.

## Checked on 2026-11-24

The five things that decide how large this phase is. All came out the small way.

1. **Its data is already in the shared database.** Nothing to move. (Owner confirmed.)
2. **A `robsmitha` tenant row exists and its rows carry that tenant's id.** (Owner confirmed.)
3. **Storage needs no move.** Read from the two Function Apps' settings, names only:
   - Product images and everything else under `AzureStorageSettings` are in `smithaconsultingprod`, the
     shared account the new backend already uses.
   - The `plaid-sync` queue is written and read through `AzureWebJobsStorage`, which is each Function
     App's own storage: `smithaconsulting9795` for the old app, `stelysianrkm72g5ewkfc6` for
     `elysian-sites`. So the two apps have **separate** `plaid-sync` queues and can never drain each
     other's. The only care needed at the cutover is to let the old queue empty before its app is
     switched off.
4. **The domain has no email.** The DNS move has no mail records to protect.
5. **Only the owner signs in.** One membership to back-fill. The second-account test in decision 3 still
   runs first, on an account made for it.

Also seen in the old app's settings: `AzureWebJobs.NightlyPlaidSync.Disabled` is present and set to `0`,
so the nightly sync is on there today. The settings it holds that the shared backend will need are
Plaid's (`ClientId`, `Secret`, `BaseUrl`, `RedirectUri`, `WebhookUrl`, `TokenEncryptionKey`,
`TokenEncryptionKeyId`), GitHub's, `CongressApiSettings__ApiKey`, `Anthropic__ApiKey` and the two
`Assistant__` switches, and `ContentManagementSettings__CmsUri`.

## Decisions

Each has a recommendation. Nothing here is built until they are agreed.

### 1. DNS moves first, on its own

Move the `robsmitha.com` zone from GoDaddy to Cloudflare as a separate step with no app change, days
before the cutover: copy every record including MX and TXT, keep the Static Web App records DNS-only (grey
cloud), switch nameservers, confirm the site and mail both still work. This is the same move done for
`smithaconsulting.com`, except that this domain is in use, so the records are copied and checked first.

**Recommended.** It separates "did DNS break something" from "did the cutover break something".

### 2. Sign-in: the same one as the admin app

The site's Vue app signs in with MSAL against the existing Entra External ID tenant, through
`@robsmitha/elysian-ui/auth`, in place of `/.auth/login/aad` and `/.auth/me`. Page protection moves from
`allowedRoles` to a route guard in the app. The API's own policies protect the data either way; the guard
only decides what the app shows.

Needs from the owner: `https://robsmitha.com` added as a redirect URI on the Entra app registration.

**Recommended.** It is the only sign-in the shared backend accepts.

### 3. Existing users are linked by email, tested with a second account first

Bank connections, budgets and saved bills hang off `User` rows found by `ExternalUserId`, which changes
with the sign-in provider. The membership backfill gives each existing admin a membership keyed by email;
their first sign-in with the new provider claims it and moves their existing user and data across.

Before the owner's own account is touched, the whole path is run with a second, throwaway account that
has a little finance data: sign in the old way, back-fill, sign in the new way, confirm the data is
there. If it is not, nothing of the owner's has changed.

**Recommended.** This is the step that can lose access to data, so it is proven on an account that
doesn't matter.

### 4. Its timers run for the tenants that have the module, through the job queue

`NightlyPlaidSync` and `CongressRefreshTrackedBills` loop over every tenant inside one timer run. On the
old Function App there was one tenant. On the shared backend that loop would visit every photography site
on every run. Move both onto the tenant job queue the photography timers already use
(`TenantJobCatalog`), each with its module (`finance`, `congress`), so they are queued only for tenants
that have it, one message each, with the queue's retries.

**Recommended.** It is the parent plan's review finding 5, and it keeps finance work away from tenants
that have nothing to do with it. Small: two job definitions and two thinner timers.

### 5. The Plaid webhook keeps its address

`https://robsmitha.com/api/PlaidWebhook?tenant=robsmitha` stays as it is, so nothing changes at Plaid.
The Worker forwards the raw body and the `Plaid-Verification` header untouched. A test proves the body
arrives byte for byte, since the signature is over the exact bytes.

**Recommended.**

### 6. Secrets are copied by the owner, and one of them must match exactly

The old Function App's settings for Plaid, GitHub, Congress.gov and the assistant become Key Vault secrets
referenced by `elysian-sites`. The owner sets each value; none is read or printed here.

`TokenEncryptionKey` must be the same value as on the old app. Plaid access tokens are stored encrypted
with it, and with a different key every bank connection would have to be re-linked by hand.

Settings that are the site's own and not secret (addresses, names) become `TenantSetting` rows, as was
done for Aspen.

### 7. Strict row-level security on the finance tables comes last

After the 14 clean days, and only once every finance row is known to carry the tenant. Until then lenient
mode stays, as it did for the photography tables.

## Build order

| # | Step | Where | Needs from the owner |
|---|---|---|---|
| 1 | The five checks | Azure, SQL | Done 2026-11-24 |
| 2 | DNS: move the zone to Cloudflare, records copied, Static Web App records DNS-only | GoDaddy, Cloudflare | Does it |
| 3 | Timers onto the tenant job queue, by module (decision 4) | Elysian, `elysian-platform` | Nothing |
| 4 | Tenant: confirm or create `robsmitha` on `Personal`, switch on `finance`, `assistant`, `congress`, `code`; tenant settings | SQL script | Runs it |
| 5 | Edge client `site-robsmitha`, one-site scope | SQL script or the platform API | Runs it, sets the Worker secret |
| 6 | Secrets into Key Vault (decision 6) | Azure | Sets each value |
| 7 | `worker/` in the robsmitha.com repo: `createSiteWorker`, static assets, deploy workflow | `robsmitha.com` | Cloudflare token for the workflow |
| 8 | Sign-in in the Vue app, route guard, `/.auth` removed (decision 2) | `robsmitha.com` | Redirect URI in Entra |
| 9 | Membership backfill, then the second-account test (decision 3) | SQL, browser | Signs in as the test account |
| 10 | Everything checked on the Worker's `workers.dev` address against the shared backend, while the live site is untouched | Browser | Looks it over |
| 11 | Cutover (below) | Cloudflare, Azure | Does the switches |
| 12 | 14 days clean, then retire the old apps and go strict (decision 7) | Azure, SQL | Does it |

Steps 3, 7 and 8 are the code. Steps 3 to 10 change nothing a visitor or the live site can see.

## The cutover

One sitting, in this order, and each line can be undone:

1. Turn the three triggers **off** on the old Function App.
2. Wait for the old app's `plaid-sync` queue to empty, then take the three off
   `disabledBackgroundFunctions` so they turn **on** in `elysian-sites`. Each app has its own queue, so
   they can't sync the same bank twice; the wait is so no queued sync is left behind.
3. Point `robsmitha.com` at the Worker: the route goes live and the Static Web App records come out.
4. Sign in, open the dashboard, run one manual bank sync, and confirm a Plaid webhook arrives (Plaid's
   dashboard can send a test one).

**Rollback** is the same lines in reverse: restore the Static Web App records, turn the triggers off in
the shared app and on in the old one. The old apps stay deployed, untouched, for the 14 days.

## Risks

- **Losing the link to finance data** on the first new sign-in. Mitigated by decision 3.
- **A different `TokenEncryptionKey`** would orphan every bank connection. Mitigated by decision 6, and
  checked in step 10 by reading one connection before the cutover.
- **A queued sync left behind** on the old app's own queue. Mitigated by letting it empty first; a missed
  one is caught by the next nightly sync.
- **A missed DNS record.** The domain has no mail, so the only records that matter are the site's own.
  Mitigated by doing DNS alone, first.
- **Finance data in a process shared with tenant sites.** Accepted in the parent plan for one owner's own
  data, guarded by module checks, encrypted tokens and, at the end, strict row-level security. Decision 4
  removes the one place finance code would have run for other tenants.
- **An old Elysian.** The site's host is on 0.0.61 and the shared one on 0.0.85. The functions are the
  shared host's own copies, already built against the current version, so the old host's version only
  matters until it is switched off.

## What this phase does not include

Any change to what the site does. The pages, the budget, the assistant and the Congress tracker move as
they are. A redesign, or moving its admin-like pages into the shared admin app, would be separate work.
