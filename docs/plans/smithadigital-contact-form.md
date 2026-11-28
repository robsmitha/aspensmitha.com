# smithadigital.com: a contact form

Status: built and deployed 2026-11-27 (elysian-platform `e963e09`). The owner took all three recommendations
below, created the site and the Turnstile widget, ran `scripts/elysian-smithadigital-contact.sql` and set the
Worker secret. Checked live: an empty form posted to `/api/contact` gets the backend's own field messages, so
the Worker, its credential and the tenant are accepted. Not yet checked: a real message arriving, which is what
proves the Turnstile secret in Key Vault and the `send.framenice.com` sender.

As built, where it differs from the plan below:

- **The tenant is created in the admin app** (Platform sites, "Its own code", identifier `smithadigital`), not
  by SQL. The SQL script only adds its `Resend` settings and the edge client.
- **The Turnstile secret** is Key Vault secret `tenant-smithadigital-turnstile-secret-key`. No Function App
  setting. A missing tenant secret is cached for a while, so allow a few minutes after adding it.
- **The site key** goes in `data-sitekey` on the form in `www/public/contact/index.html`. Empty means "email
  us instead".
- **`run_worker_first: ["/api/*"]`** works on wrangler 4.166: pages are served without running code.
- **Found while building:** `PlatformEmail__SendingDomain` is not set on `elysian-sites` and was not in
  `infra/main.bicep`, so shared-template sites have had no address to send from (contact forms and booking
  emails fail). Added to the Bicep file as `send.framenice.com`; it takes effect when the file is next applied.
  The Smitha Digital tenant does not depend on it: it has its own From address in its settings.

## Why

The marketing site (`elysian-platform/www`, live since `d35d31d`) ends every page with "Email us", a `mailto:`
link. A visitor without a mail app set up has to copy the address, and we learn nothing about what they want.
A form that asks which service they are after and sends it to an inbox of the owner's choosing closes that gap.

## What already exists

Every photography site's contact form runs on these, and the marketing site can use them unchanged:

| Piece | Where | What it does |
|---|---|---|
| `POST /api/contact` | `functions/ContactFunctions.cs` → Elysian `SendContactMessageCommand` | Validates, drops honeypot hits quietly, checks the Turnstile token, emails the tenant's inbox with the visitor as Reply-To |
| Fields | `SendContactMessageCommand` | `Name`, `Email`, `Subject` (required); `Phone`, `Message`, `ReferralSource` (optional); `Website` (honeypot); `TurnstileToken` |
| Recipient | `TenantSetting` section `Resend`, `ToEmailAddress` | Per tenant. Falls back to the address confirmed in the admin app |
| Edge forwarding | `packages/site-edge` `forwardToElysian` | A Worker passes a request to the backend as one tenant, with its own credential; strips headers a browser must not set |
| Edge clients | `EdgeClient` table, scope `Tenant = 1` | One client per site Worker; the table holds only a hash of its key |
| Rate limits | Worker `ratelimits` binding; `ContactRateLimiter` in the host | Coarse at the edge, finer in the backend |
| Per-tenant Turnstile secret | Key Vault, `tenant-{identifier}-{name}` | `TurnstileVerificationService` uses a tenant's own secret before the host's |

No Elysian change is needed: "which service" goes in `Subject`.

## Design

### 1. The form lives on its own page, `/contact/`

The homepage is what Google and Meta read when they review the calendar and Instagram connections, and today
it runs no script at all. Keeping the form off it means the homepage and `/photography/` keep the policy they
have now (`script-src` absent, `form-action 'none'`), and only `/contact/` is loosened.

- Every "Start a project", "Start with Basic/Pro", "Talk about…" and "Email us" button links to `/contact/`.
  Plan buttons carry the choice in the fragment (`/contact/#pro`) so the form opens with it selected.
- The contact band on the other two pages stays, with the button pointing at `/contact/` and the address
  still shown as text.

`/contact/` gets its own header rule in `www/public/_headers`:

```
/contact/*
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'none'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

`form-action` stays `'none'`: the script sends the form with `fetch`, so the browser never submits it itself.

### 2. The form

| Field | Sent as | Notes |
|---|---|---|
| Your name | `Name` | required |
| Email | `Email` | required |
| What do you need? | `Subject` | select: Photography website (Basic), (Pro), (Custom), Custom platform build, Something else |
| Tell us about it | `Message` | optional, 5000 characters |
| (hidden) | `Website` | honeypot |
| Turnstile widget | `TurnstileToken` | |

A small script (`/contact/contact.js`, plain file, no build step) submits it and shows one of: sending, sent,
the backend's own field messages (400), "too many messages, wait a few minutes" (429), or "couldn't send, email
us at …" for anything else. Without script the page says so and shows the address; the form's button is
disabled until the script and the widget have loaded.

The widget and script are only on `/contact/`, so no other page's load is affected.

### 3. The Worker gains a script

`smithadigital-www` serves files only. It becomes a Worker with a `main`:

- `assets.run_worker_first: ["/api/*"]`, so every page and file is still served straight from static assets and
  the Worker's code runs only for the form post. (To confirm when building that this wrangler version accepts a
  path list here; if not, the Worker runs first for everything and hands non-API requests to `env.ASSETS`.)
- `POST /api/contact` only. Anything else under `/api/` is 404. Body over 16 KB is 413.
- Rate limit by `CF-Connecting-IP` with a `ratelimits` binding (`FORM_LIMITER`, namespace `1002`, 5 a minute).
  A limiter that cannot be reached never blocks a message, as in the photography Worker.
- `forwardToElysian(request, { origin: ELYSIAN_ORIGIN, credential: ELYSIAN_EDGE_CREDENTIAL, tenant: 'smithadigital' })`.
  The tenant is fixed in code; nothing from the browser chooses it.
- No credential set: answer 503 with a message the page turns into "email us instead".

`www` gets a `package.json`, `src/index.ts`, a `tsconfig.json` and vitest tests (routing, the size cap, the
limiter, that the tenant and credential headers are the Worker's own). `deploy-www.yml` adds typecheck and
tests before deploy. The placeholder check on the privacy policy stays.

### 4. A tenant for Smitha Digital

The backend sends on behalf of a tenant. A new one, `smithadigital`:

- Not a cloud (shared-template) tenant: it has no site on `framenice.com`, no modules, no storage.
- `TenantSetting` section `Resend`: `ToEmailAddress` (decision 1) and `FromEmailAddress` (decision 2).
- An edge client `site-smithadigital`, scope `Tenant`, for the Worker.

The SQL is written when building, against the schema as it then stands, in the style of
`scripts/elysian-site-robsmitha-edge-client.sql` and `scripts/elysian-add-aspen-tenant-settings.sql`: safe to
run twice, no secrets in it (the edge client row holds a hash; the key itself is shown once for the owner to
put in the Worker). The owner runs it.

To check when building: that a tenant with no runtime and no modules is accepted by the tenant resolver and by
`/api/contact` for a tenant-scope edge client. The `robsmitha` tenant is the precedent.

### 5. Turnstile

The backend picks the secret in this order: the tenant's own, then (cloud tenants only) the shared cloud
widget's, then the host's. `smithadigital` is not a cloud tenant, so it needs its own (decision 3).

Recommended: a new widget for `smithadigital.com`, its site key in the page (public), its secret in Key Vault
as the tenant's Turnstile secret (`tenant-smithadigital-…`; exact name from `TenantSecretNames` when building).
Tenant secrets are read from Key Vault directly, so this adds no Function App setting and no change to
`infra/main.bicep`. To confirm when building.

## Failure modes

| What goes wrong | What the visitor sees |
|---|---|
| Backend cold start (up to a minute) | "Sending…" until it answers; the button is disabled so it is not sent twice |
| Backend down or times out | "Couldn't send. Email us at …" with the address |
| Turnstile fails or expires | The backend's message; the widget resets and they can try again |
| Too many posts | "Wait a few minutes" |
| Script blocked or disabled | The address, and a line saying the form needs script |
| Worker secret missing | Same as backend down |
| Recipient not set on the tenant | Backend answers 500; same as backend down. Caught by the post-deploy test below |

Nothing on the homepage or `/photography/` depends on any of this.

## Steps

| # | What | Who |
|---|---|---|
| 1 | Answer the three decisions below | Owner |
| 2 | Create the Turnstile widget for `smithadigital.com`; put its secret in Key Vault under the name given | Owner (secret never pasted in chat) |
| 3 | SQL: tenant, `Resend` settings, edge client | Claude writes, owner runs |
| 4 | Worker script, `/contact/` page, script, styles, headers, tests, workflow | Claude, on a branch |
| 5 | `npx wrangler secret put ELYSIAN_EDGE_CREDENTIAL` in `www/` | Owner |
| 6 | Commit, merge, push (on the owner's word) | Claude |
| 7 | Send one real message from the live page and see it arrive | Owner |

Steps 2, 3 and 5 can happen in any order before 7. Until 5 is done the page answers "email us instead".

## Decisions needed

1. **Which inbox receives the messages?** Recommended: `smithadigital.support@gmail.com`, the address already
   on the site. Any address works; it is one field in the tenant's settings and can be changed later.
2. **Which address do they come from?** Only the owner ever sees it; the visitor's address is the Reply-To.
   Recommended: an address on the platform's sending domain, which Resend has already verified (the one cloud
   sites send from; exact domain to be read from the Function App's settings when building). No DNS change.
   The alternative is verifying `smithadigital.com` in Resend, which means new DNS records and is only worth
   it if the site later emails visitors.
3. **Turnstile: a new widget, or reuse one?** Recommended: new widget for `smithadigital.com` (step 2). Reusing
   the host's widget would mean adding this hostname to a widget that belongs to another site.

## Not in this plan

- Keeping messages in the database, or a screen for them in the admin app. They arrive by email only.
- An automatic reply to the visitor.
- A form on the homepage itself.
- Any change to Elysian.
