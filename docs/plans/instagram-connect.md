# Connecting a photographer's Instagram

Status: live since 2026-11-27 (UTC). The Connect button is on, released in Elysian 0.0.88 and
elysian-platform, and a first account was connected through it on the test site `cloud-site`. What remains is
Aspen reconnecting (step 7) and the items under "Done, and what is left".

## Done, and what is left

Done:

- The existing Meta app renamed to Smitha Digital, with Instagram business login and the return address. Its
  Instagram app name was synced too, so Instagram's approval screen says "Smitha Digital-IG". Meta adds the
  "-IG" itself.
- Elysian 0.0.88 and elysian-platform released; `instagram-app-secret` set in Key Vault; the Bicep file
  applied.
- A switch for the Instagram add-on on the Platform screen. Only Online booking had one, so the add-on
  could not be turned on for a cloud site.
- Tried on `cloud-site` with the account `smithaconsulting` at 03:59 UTC on 2026-11-27: connected, the
  token stored with its expiry, the first sync run (the account has no posts, so none were mirrored), and
  the scheduled sync picked the site up.

Left:

- **Aspen reconnects** with the button. Her pasted token keeps refreshing until she does, so there is no
  hurry. She is already a tester on the app.
- **Not yet seen working:** a sync that mirrors posts for an account connected with the button; the weekly
  refresh of a button-issued token (due a week after connecting); Disconnect; the Cancel path on Instagram's
  screen; Reconnect Google Calendar through the return page the two services now share.
- **The shared templates don't draw the feed.** Only Aspen's own site shows it. On a cloud site, connecting
  mirrors the posts but nothing appears on the site. That is separate work, not started.
- **Don't try the button on Aspen's site with another account:** a successful connection replaces hers and
  the sync would swap her home page feed.

## Goal

A photographer the operator has invited turns on the Instagram feed on their home page by clicking one
button and approving on Instagram, the same way they connect Google Calendar. Nobody generates or pastes a
token. No review or verification by Meta is needed for this version.

## Where it stands

How the feed works today (Elysian, `Features/Instagram`):

- The site mirrors the account's latest 12 posts: a daily sync copies them, makes small thumbnails, and the
  home page serves them from the platform's own storage. Instagram is never called while a visitor waits.
- It uses Meta's "Instagram API with Instagram Login" (`graph.instagram.com`), with a long-lived token per
  tenant in `OAuthToken`. A weekly job refreshes the token, which otherwise dies after 60 days.
- All of that is right and stays.

How an account gets connected today:

- The operator adds the photographer's Instagram account to the Meta app as a tester, the photographer
  accepts, the operator generates a long-lived token in the Meta dashboard and pastes it into the admin app.
- The platform holds no Meta app ID or secret: `InstagramSettings` has neither.

## What changes

Meta's **Business Login for Instagram** replaces the pasted token:

1. The photographer clicks Connect Instagram. The admin app asks the backend where to send them, and goes to
   `https://www.instagram.com/oauth/authorize` with the app's ID, the return address, the permission wanted
   and a single-use `state` value.
2. They approve on Instagram, which returns them to the admin app with a code (good for one hour, once).
3. The admin app hands the code to the backend. The backend exchanges it for a short-lived token (one hour),
   then that for a long-lived one (60 days), reads the account's name, stores the token and syncs the posts.
4. The existing weekly refresh keeps the token alive from there.

The token never reaches the browser. The permission is `instagram_business_basic` (read the profile and
posts). No Facebook Page is needed.

## For a photographer

1. **The operator invites them once:** their Instagram username is added as a tester on the Meta app.
2. **They accept** in Instagram's settings, under apps and websites.
3. **They click Connect Instagram** in the admin app and approve.

The operator's work per photographer drops from "invite, generate a token, paste it" to "invite".

## Limits

- **Professional accounts only** (business or creator). Personal accounts can't use this API; Meta closed the
  old one for them in December 2024. Switching is free in the Instagram app.
- **Invitation first.** On Standard Access, which every Meta app starts with and which needs no review, only
  accounts with a role on the app can connect. Anyone else gets an error from Instagram.
- **A cap on testers.** Meta limits how many an app can have. The number was not confirmed; check it before
  relying on this for many photographers.

## Decisions

### 1. One Meta app for the whole platform, owned by Smitha Digital

**Decided 2026-11-26: the existing app was renamed and reused.** It was called aspensmitha.com and is now
Smitha Digital, with Instagram business login added and the return address listed. Its Instagram app ID is
`1639292734580056` (not a secret; it is in `infra/main.bicep`). Because it is the app that made Aspen's
current token, that token keeps working and she is already a tester on it. Whether the app needs a Meta
business portfolio at this stage was not confirmed.

### 2. The permission is `instagram_business_basic` only

No publishing, comments or messages. **Recommended.**

### 3. The return address is on the admin app

`https://manage.smithadigital.com/integrations/instagram/callback`, one address for every tenant, with the
site named in the same single-use `state` the Google flow uses. **Recommended.**

### 4. Three new platform settings

`Instagram:AppId`, `Instagram:AppSecret` (Key Vault secret `instagram-app-secret`) and
`Instagram:RedirectUri`, all platform-only. The button stays off until all three are set. The secret must be
in Key Vault before the Bicep file is applied: an app setting that points at a missing secret is not empty,
so the button would show and then fail. **Built.**

### 5. The token box stays for platform admins only

As the way to repair a connection by hand. **Built.**

### 6. Disconnect forgets the token and the mirrored posts

The home page goes back to the "Follow along on Instagram" link. Whether Meta offers a call to withdraw the
grant from the platform's side was not confirmed, so none is made: the Disconnect dialog says how to remove
the app inside Instagram. **Built.**

### 7. The Connect panel says what is needed first

"Your Instagram account needs to be a professional account (business or creator); it's free to switch in the
Instagram app. Accept the invitation from Smitha Digital in Instagram before you connect."
**Recommended.**

## Build order

| # | Step | Where | Needs from the owner |
|---|---|---|---|
| 1 | Find which Meta app and account made today's tokens | Meta developer dashboard | Done |
| 2 | The app renamed to Smitha Digital; Instagram business login added; the return address listed; app ID sent, secret kept | Meta | Done |
| 3 | Start, complete and disconnect, ending in the existing store-and-sync | Elysian | Done, in 0.0.88 |
| 4 | Three endpoints; the settings | `elysian-platform/functions`, `infra/main.bicep` | Done |
| 5 | Connect button, return page (shared with Google's), Disconnect; token box for platform admins only | `elysian-platform/admin` | Done |
| 6 | Released; settings applied; tried with the owner's own Instagram account as a tester | Azure, admin app | Done on `cloud-site` |
| 7 | Aspen reconnects (she is already a tester on the app) | Admin app | Asks her |

One choice made while building: the address sent to Instagram carries `force_reauth=true`, so Instagram asks
who is signing in even when the browser already has a session. A photographer whose browser is signed in to a
personal account would otherwise connect the wrong one.

## Risks

- **A photographer has a personal account.** They are told before they leave for Instagram, and the site
  keeps its "Follow along" link.
- **They click Connect before accepting the invitation.** Instagram shows its own error. The panel says to
  accept first, and nothing on the site changes.
- **A token dies** when the photographer changes their password or removes the app, or if the weekly refresh
  fails for 60 days. The connection status already shows this; with the button the fix is one click.
- **Aspen's feed during the switch.** It stays up: the site serves mirrored copies, and her old token keeps
  working until she reconnects.
- **Meta changes this API often.** The old permission names were retired in January 2025. The calls are
  behind one service class, so a change stays in one place.

## Later: connecting without an invitation

Any professional account can connect alone once the app has **Advanced Access**. That needs Meta's App
Review (a screen recording, a privacy policy section for Instagram, a data-deletion address and a deauthorize
callback) and **Business Verification** (documents showing a legal business owns the app). It is stricter
than Google's process: there is no stage where strangers can connect before approval, and Meta checks the
business as well as the app. None of the code above changes when it is granted.

If Business Verification can't be passed, a feed service that already holds Meta's approval (Behold and
similar) can stand in: the photographer signs in there and the platform reads the feed address it provides.
Pricing and limits were not checked.

## What this plan does not include

Posting to Instagram, comments, messages, insights, and any change to how the feed is synced, stored or drawn.

## Sources

- Meta: [Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login)
- Meta: [Instagram Platform overview: access levels, account types, tokens](https://developers.facebook.com/docs/instagram-platform/overview)

Not confirmed: the cap on testers; whether a business portfolio is needed for the app at this stage; whether
a grant can be withdrawn by an API call; review and verification times; what Business Verification accepts
from a sole trader.
