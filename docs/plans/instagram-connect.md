# Connecting a photographer's Instagram

Status: proposed 2026-11-26. Nothing here is built.

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

Not Aspen's or a personal one, for the same reasons the Google project moved. If today's app is someone
else's, tokens made with it keep working until each account reconnects with the button. Whether the app
needs a Meta business portfolio at this stage was not confirmed. **Recommended; who owns today's app is the
owner's to check.**

### 2. The permission is `instagram_business_basic` only

No publishing, comments or messages. **Recommended.**

### 3. The return address is on the admin app

`https://manage.smithadigital.com/integrations/instagram/callback`, one address for every tenant, with the
site named in the same single-use `state` the Google flow uses. **Recommended.**

### 4. Three new platform settings

`Instagram:AppId`, `Instagram:AppSecret` (Key Vault) and `Instagram:RedirectUri`, all platform-only. The
button stays off until the return address is set, as with Google. **Recommended.**

### 5. The token box stays for platform admins only

As the way to repair a connection by hand. **Recommended.**

### 6. Disconnect forgets the token and the mirrored posts

The home page goes back to the "Follow along on Instagram" link. Whether Meta offers a call to withdraw the
grant from the platform's side was not confirmed; if not, Disconnect says how to remove the app inside
Instagram. **Recommended.**

### 7. The Connect panel says what is needed first

"Your Instagram account needs to be a professional account (business or creator); it's free to switch in the
Instagram app. Accept the invitation from Smitha Digital in Instagram before you connect."
**Recommended.**

## Build order

| # | Step | Where | Needs from the owner |
|---|---|---|---|
| 1 | Find which Meta app and account made today's tokens | Meta developer dashboard | Does it |
| 2 | A Meta app for Smitha Digital with the Instagram product; the return address added; app ID sent, secret kept | Meta | Does it |
| 3 | Start, complete and disconnect, ending in the existing store-and-sync | Elysian | Nothing |
| 4 | Three endpoints; the settings | `elysian-platform/functions`, `infra/main.bicep` | Sets the secret in Key Vault |
| 5 | Connect button, return page (shared with Google's), Disconnect; token box for platform admins only | `elysian-platform/admin` | Nothing |
| 6 | Released; settings applied; tried with the owner's own Instagram account as a tester | Azure, admin app | Publishes, connects |
| 7 | Aspen accepts a tester invitation on the new app and reconnects | Admin app | Invites her |

Steps 3 to 5 are the code, a day or two given the Google work.

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
