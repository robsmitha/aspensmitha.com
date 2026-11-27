# Drawing the Instagram feed in the shared templates

Status: live since 2026-11-27. The section and its script are on the home page of every cloud site with the
Instagram add-on, in all seven templates. Not yet seen: tiles drawn from real posts, because the only account
connected to a cloud site has none.

## Done, and what is left

Done 2026-11-27:

- Built as planned and deployed with elysian-platform. No template version changed.
- Checked on the test site (`cloud-site`, at `www.smithaconsulting.com`): the hidden section and the script
  are in the home page, the script loads, the page is served with scripts and requests limited to the site
  itself, and the posts endpoint answers. A site without the add-on (`address-test`) has neither.
- The Platform screen and the Integrations panel no longer say the templates don't draw the feed.

Found on the way, and fixed the same day:

- **The Function App had lost its `EdgeStore` settings.** They were set by hand and never in
  `infra/main.bicep`, and applying that file replaces the whole list. From some apply after 2026-11-24,
  publishing a cloud site failed and add-on switches (Instagram, Online booking) never reached the site
  Worker, with no error logged. The three settings are now in the file. Any new Function App setting must go
  into the file, never only by hand.
- **Instances went from 512 to 2048 MB.** A photo resize ran the worker out of memory (exit code 137) and
  failed the requests it was answering. At this usage the larger size stays inside the monthly free grant.

Left:

- **Tiles from real posts**, and how the row looks at phone, tablet and desktop widths. Nothing in the repo
  tests the script in a browser.
- **Layout shift** (decision 4): to be read from the per-site Web Vitals once a site with posts has visitors.
- **Publishing a cloud site** after the settings came back: the same write path was seen working for the
  add-on switch, but a publish itself was not tried.

## Goal

A cloud site with the Instagram add-on shows its latest Instagram posts on its home page. A site without the
add-on gets nothing: no section, no script, no request, and its home page stays exactly as it is today.

## Where it stands

- Connecting works for cloud sites (see `instagram-connect.md`): the posts are mirrored every half hour, with 320 and
  640 pixel WebP thumbnails on the platform's images host.
- `GET /api/instagram/posts` is already open to visitors on every cloud site's address, and is cached for
  five minutes. It reads the database only, never Instagram.
- Only Aspen's own site draws the feed. None of the seven shared templates do.
- The site Worker already knows each site's modules (`entry.modules`) and already uses that to include or
  leave out the booking pages.

## How it will work

1. The Worker passes `hasInstagram` to the template, the same way it passes `hasBooking`.
2. On the home page only, and only when `hasInstagram` is true, the template writes an empty, hidden section
   near the foot of the page and one small script.
3. The script asks `/api/instagram/posts`, builds up to six square tiles and shows the section. Each tile is
   a plain `<img>` with its size known, lazy-loaded, linking to the post on Instagram.
4. No posts, or the request fails: the section stays hidden. Nothing is ever shown empty.

## Decisions

### 1. The feed is filled by a script, not drawn into the HTML

Pages are kept at the edge per published version, and nothing is purged. Posts change through the day without a
publish, so drawing them into the HTML would mean either a backend call before the page can be sent (a cold
Function App in front of the hero image) or a new "feed version" written to the edge on every sync. Galleries
and stories already solve the same problem with a small script, and the feed is below the fold, so it can
never be the largest paint. **Recommended.**

### 2. The gate is the module, checked at the edge

`entry.modules.includes('instagram')`. A site without it gets no section and no script. The page cache key
gains the module (today it carries only booking), so turning the add-on on or off shows on the next visit.
**Required by the request.**

### 3. Home page only, last section before the footer

It is the one place Aspen's site shows it, and it keeps every other page free of the script. **Recommended.**

### 4. Nothing is reserved for it; the section appears when filled

The add-on being on does not mean an account is connected, so a reserved band would sit empty on some sites.
The script runs as soon as the page loads, and the section sits above the footer at the bottom of a long
page, so the insert happens off screen. The risk is a small layout shift for a visitor who reaches the bottom
within the first moment. The per-site Web Vitals reports will show if it matters; the fix would be to record
"connected, with posts" in the edge entry and reserve the space then. **Recommended, to be checked with
measurements.**

### 5. Six square tiles, no new content fields

Twelve posts are mirrored; six are shown: two across on a phone, three on a tablet, six on a desktop. The
heading is fixed wording ("On Instagram"), and a "Follow" link is shown when the owner has entered their
Instagram address under the site's links. No template schema changes, so nothing for owners to fill in and,
as far as I can tell, no template version changes. **Recommended; the wording is the owner's to change.**

### 6. A tile is only ever a link to Instagram and an image from the images host

The script builds elements with DOM calls, never HTML strings. A post whose link isn't
`https://www.instagram.com/...` or whose image isn't on the images host is left out. The alt text is the
caption, shortened, or "Instagram post". **Recommended.**

### 7. The home page of a site with the add-on is served as a page with a script

Today a home page carries no script and is served with scripts forbidden. With the add-on it is served under
the same rules as a gallery page: the template's own scripts, and requests to the site's own address. Sites
without the add-on are unchanged. **Follows from decision 1.**

## What changes, and where

| Where | Change |
|---|---|
| `cloud-photography/src/site.ts` | `hasInstagram` from the modules; passed to `render` and to the owner's preview; added to the page cache key |
| `templates/photography/shared/render.ts` | `hasInstagram` in `RenderInput`; the script added on the home page; that page marked as having a script |
| `templates/photography/shared/instagram.ts` (new) | The script: fetch, check, build tiles, show the section |
| `templates/photography/shared/Page.vue`, `classic/src/Page.vue`, `gallery/src/Page.vue` | The hidden section, only when `hasInstagram` |
| `templates/photography/shared/base.css`, plus each template's `styles.css` if it needs its own look | The tile grid |
| Each template's `vite.config.ts` (seven) | The new script as a build entry |
| `admin` | The Platform switch and the Integrations panel stop saying the templates don't draw the feed |

Nothing changes in Elysian or the Function App.

## Build order

1. The script and its tests (what is shown, what is left out, hidden when empty or failed).
2. The section in the three page files, the styles, and the build entry in all seven templates.
3. The Worker: the flag, the cache key, the preview.
4. Render tests: with the add-on the home page has the section and the script, and no other page does;
   without it the home page is byte-for-byte what it is today.
5. Admin wording.
6. Deployed; checked on `cloud-site` with an account that has posts.

About a day.

## Risks

- **The home page gains a script on sites with the add-on.** It is small, loads as a module so it never
  holds up the page, and does nothing until the response arrives.
- **Layout shift** as in decision 4.
- **The owner's preview shows no feed.** Preview pages run no scripts, so the section stays hidden there. The
  live site shows it.
- **A template's own page file is missed.** Classic and Gallery have their own; the render tests in step 4
  cover all seven.
- **Step 6 needs posts.** The only account connected to a cloud site so far has none.

## What this plan does not include

Aspen's own site (it already draws the feed), playing videos, showing captions, choosing how many posts to
show, and a heading the owner can edit.

## Not confirmed

- What the posts endpoint answers for a site without the add-on. It doesn't matter for this design, since
  such a site never asks.
- That Instagram thumbnails sit under `/photos/` on the images host for cloud sites, which the existing
  image helper requires. The same code gives gallery photos their addresses, and those load, but no Instagram
  thumbnail has been loaded from a cloud site yet.

Settled since: adding the script needed no template version change.
