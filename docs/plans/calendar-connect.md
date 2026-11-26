# Connecting a photographer's calendar

Status: the code (build order steps 2 to 4a) was released 2026-11-26 in Elysian 0.0.87 and deployed with
elysian-platform. The Connect button is off until the return address is set at the switch (step 5a), and the
backend still uses the old Google client, so nothing has changed for a photographer yet.

## Goal

A photographer on a cloud site turns on online booking by connecting the calendar they already keep on
their phone, in one step, without ever opening Google Cloud. It keeps working without attention, and the
platform can take on photographers the operator has never met.

## Where it stands

How booking uses the calendar today (Elysian, `Features/Booking` and `Features/GoogleCalendar`):

- **Availability:** every event on the photographer's calendar blocks time, including all-day events and
  events marked "free". This is the reason for a phone calendar: block a day by adding an event.
- **A booking** is written to the calendar as a tentative event carrying hidden tags. There is no booking
  table: the calendar is where bookings are stored, and "upcoming bookings" in the admin app is a search
  for those tags.
- **A daily check** proves access still works and emails the photographer when it doesn't.

How a calendar gets connected today:

- There is **no "Connect" button.** The admin app has a box to paste a *refresh token* "issued for this
  site's OAuth client". Only the operator can make one, by hand, with the platform's client secret. A
  photographer cannot do this themselves at all.
- **One Google Cloud app for every tenant.** `GoogleCalendar:ClientId` and `ClientSecret` are platform
  settings; each tenant has its own token in `OAuthToken`. That part is right, and is how every booking
  product does it.
- It asks for the **broadest scope there is** (`calendar`: see, edit, share and permanently delete every
  calendar the person can reach). Booking needs far less.

So the concern is correct, and the first obstacle comes even earlier than the token: there is no way for a
photographer to grant access in the first place.

## What other photographers would run into

It depends on the Google Cloud app's publishing status, which only the owner can see (Google Cloud console,
"Google Auth Platform", "Audience"). **This is the first thing to check.**

| The app is | What happens to a photographer |
|---|---|
| **Testing** | Only people the operator has added by hand as test users can connect (100 at most). **Their access expires seven days after they grant it**, every time. Booking would break weekly. |
| **In production, not verified** | Anyone can connect, but first sees Google's "Google hasn't verified this app" warning and must click through "Advanced". **100 people in total, for the life of the project; the count can't be reset.** Tokens do not expire after seven days. |
| **In production, verified** | A normal Google consent screen with the platform's name. No cap, no warning. |

Aspen's connection lasting longer than a week would mean the app is already "In production, not verified".
If it has needed a new token about weekly, it is in "Testing".

Other things that are true whatever the status:

- **Calendar scopes are "sensitive", not "restricted".** Verification is a review by Google, with no paid
  security audit (that is only for restricted scopes such as Gmail and Drive).
- **Verification needs:** a homepage on a domain the operator has verified, that isn't just a sign-in page;
  a privacy policy on that domain, linked from the consent screen; ownership of every authorised domain; a
  demo video of the whole flow including the consent screen; and a written reason for each scope and why a
  narrower one wouldn't do.
- **How long it takes is not stated by Google.** Guides report anything from a few days to a few months,
  the delays mostly from back-and-forth over the privacy policy and the video. Not confirmed.
- **A photographer on a company Google Workspace account** can be blocked by their own administrator from
  granting access to an outside app. Most photographers use a personal account, where this doesn't apply.

## Options

### 1. A "Connect Google Calendar" button, with Google's verification (recommended)

The photographer clicks Connect, picks their Google account, clicks Allow, and is back in the admin app
with booking on. This is what they already know from every other app that uses their calendar.

- **Build:** the standard sign-in redirect and its return page; the token then goes through the check and
  storage that exist today. Ask for `calendar.events` (see and edit events) in place of `calendar`.
- **Operator work:** switch the app to "In production"; a homepage and privacy policy for the brand; the
  demo video; submit and answer Google's questions.
- **It can ship before Google answers.** Until verified it works for the first 100 photographers, with the
  warning screen. After, nothing changes in the code.
- **Why `calendar.events` and not something narrower:** the narrower "availability only" scopes report only
  events marked busy. An all-day event is marked "free" by default in Google Calendar, so a photographer
  blocking a day that way would still be offered for booking. Reading events is needed to keep today's
  rule that anything on the calendar counts.

### 2. Share the calendar with a platform address (no verification at all)

The platform has one service account with an address like `bookings@….iam.gserviceaccount.com`. The
photographer opens their calendar's settings, shares it with that address with "Make changes to events",
and types their own calendar address into the admin app.

- **For:** no consent screen, no verification, no user cap, nothing that expires. Could be live in days.
- **Against:** it is four or five steps in Google Calendar's settings on the web (sharing isn't offered in
  the phone app, as far as I know; not confirmed), with an odd-looking address to paste. Bookings appear as
  created by that address. A shared calendar isn't added to the service account's list by itself any
  more, so the platform reads it by its address, which works.
- **Use:** the fallback if verification stalls, not the main road. It fails the "one step" test.

### 3. A calendar link, for any calendar app (later, as an addition)

Google, Apple and Outlook calendars can each give a private link to the calendar as a feed. The
photographer pastes it once; the platform reads it to see busy time. Bookings can't be written back
through a link, so each booking is emailed as a calendar invitation the photographer accepts with a tap.

- **For:** works with Apple and Outlook calendars, which option 1 never will. Nothing to verify.
- **Against:** read-only, so bookings must be stored by the platform itself (a booking table). Finding the
  link takes a few steps, and some Workspace accounts hide it.
- **Use:** the answer for a photographer who isn't on Google. Worth doing once one asks.

### 4. A calendar service in the middle (Cronofy, Nylas and similar)

One connection method for Google, Apple and Outlook, run by someone else.

- **Against:** priced for products with thousands of users. The figures found range from about $99 a month
  as a minimum to several hundred, and they conflict; none is confirmed. Whether it removes the need for
  the platform's own Google verification depends on the vendor and wasn't confirmed either.
- **Use:** not at this size. Revisit if Apple and Outlook photographers become common.

### 5. The platform's own calendar

Working hours and blocked dates kept in the admin app.

- **Against:** the photographer keeps two calendars, and the one on their phone stops being the truth. That
  is the problem the Google connection was chosen to avoid.
- **Use:** no. A small part of it (a booking table) arrives anyway with option 3.

## Recommendation

**Option 1 now.** It is the only one that is one step for the photographer and uses the calendar already
on their phone, and the build is small because checking, storing, refreshing and health-checking tokens all
exist. Start Google's verification the same week; until it lands, the first photographers connect through
the warning screen.

**Option 3 later**, when the first photographer on Apple or Outlook turns up.

Options 2, 4 and 5 are not planned. Option 2 stays in reserve.

## Decisions

### 1. One Google app for the whole platform

As today. Photographers never see Google Cloud. **Recommended.**

### 1a. That app moves to a new project owned by a business account

Found 2026-11-26: the client the backend uses today (project number 605120805188) was created under
Aspen's Google account. The platform's app gets a **new Google Cloud project owned by a business Google
account**, with the owner's personal account as a second Owner so access can't be lost.

- The consent screen shows the project's name and a support email to every photographer; those should be
  the platform's. The support email must be an owner of the project.
- Google's verification emails go to the owner account, and domain ownership is proved in Search Console
  by an owner.
- The 100-person allowance is per project, so the new one starts clean.
- **Cost:** a new client ID and secret, so Aspen's existing token doesn't work with it. She reconnects
  once, with the button. The switch and her reconnect happen in one sitting, since booking on her site is
  down in between.

Created 2026-11-26: project `smithadigital` (number 339462048381), owned by a business Gmail account,
Calendar API enabled. The new client ID will start with that number. Still to do there: consent screen,
client, "In production" (build order, step 5).

The old project is left as it is until the switch, then its client is deleted. **Decided.**

### 2. The scope is `calendar.events`

Enough to read every event (availability) and write bookings; no access to sharing, settings or deleting
calendars. Whether a still narrower pair would pass review more easily isn't worth the lost all-day
blocking. **Recommended.**

Found while building, 2026-11-26:

- **`openid` and `email` are asked for too.** With `calendar.events` alone Google won't say whose calendar it
  is: the call the code used for that (reading the calendar itself) needs a broader grant. The address is
  only shown in the admin app as the connected account. Both are non-sensitive and add nothing to the review.
- **Access is proved by reading the events list**, for the same reason. Aspen's older, broader grant passes
  the same check.
- **A person can untick the calendar permission on Google's screen.** The connection is then refused with a
  plain message, the unusable grant is withdrawn, and any working connection is kept.

### 3. The return address is on the admin app

`https://manage.smithadigital.com/integrations/google/callback`, one address for every tenant, with the
tenant carried in a signed, single-use `state` value (the `OAuthState` table already does this for
GitHub). **Recommended.**

### 4. The brand on the consent screen is Smitha Digital

The consent screen, homepage and privacy policy name the platform (Smitha Digital, `smithadigital.com`),
not the photography product. The same Google app will serve other booking products later (a property
booking app, for one), and a verified brand can't be shared between names: each new name would be a new
review. The return address is already on `manage.smithadigital.com`, so one domain is verified with Google
instead of two. The consent screen text says what the photographer is connecting to in plain words
("Smitha Digital runs online booking for your site"). `smithadigital.com` needs a real homepage and a
privacy policy before the review. **Decided 2026-11-26.**

### 5. The paste-a-token box goes away for photographers

It stays only for a platform admin, as the way to repair a connection by hand. **Recommended.**

### 6. Disconnecting tells Google

Removing the connection in the admin app also revokes the token at Google, so the platform holds no access
it doesn't use. Google's review asks about this. **Recommended.**

### 7. Aspen reconnects once, at the switch

Her token belongs to the old project's client and stops working when the backend moves to the new one
(decision 1a). She reconnects with the button straight after the switch, which also narrows her grant to
`calendar.events`. Until the switch nothing changes for her. **Decided.**

## Build order

| # | Step | Where | Needs from the owner |
|---|---|---|---|
| 1 | Check the old project's publishing status (signed in as Aspen). "Testing" means her connection is on a seven-day clock until the switch | Google Cloud console | Does it |
| 1a | Business Google account; new project; personal account added as Owner; Calendar API enabled | Google Cloud console | Does it |
| 2 | Start and finish the connection: the address to send the person to, and the exchange of the returned code, ending in the existing check-and-store | Elysian | Nothing |
| 3 | Two endpoints | `elysian-platform/functions` | Nothing |
| 4 | Connect button, return page, disconnect; token box for platform admins only | `elysian-platform/admin` | Nothing |
| 4a | Released: Elysian tagged and published, the host's package reference bumped, both merged | Elysian, elysian-platform | Publishes |
| 5 | In the new project: consent screen (name, support email, External), scopes `calendar.events`, `openid` and `email`, a Web client with the return address, app "In production" | Google Cloud console | Does it |
| 5a | The switch: `googleCalendarClientId` and `googleCalendarRedirectUri` in `infra/main.bicep` and the `google-client-secret` secret changed to the new client (the Connect button stays off while the return address is empty), then Aspen reconnects with the button, in one sitting | Azure, admin app | Sets the secret; Aspen clicks Connect |
| 6 | Tried end to end with the owner's own Google account, on a test site, before 5a if a test backend is available and straight after it if not | Admin app | Connects a test site |
| 7 | Homepage and privacy policy for the brand, saying what calendar data is read and that it is used only for booking | `smithadigital.com` | Approves the wording |
| 8 | Demo video and the scope explanation; submit for verification | Google Cloud console | Records and submits |
| 9 | Option 3 (calendar link, booking table, emailed invitations) | Elysian, admin | When asked for |

Steps 2 to 4 are the code, and are a few days' work. Steps 7 and 8 are what take calendar time.

## Risks

- **The 100-person allowance can't be refilled.** Every different Google account that passes the warning
  screen uses one. Test with one or two accounts, not a new one each time.
- **Verification is refused or drags on.** Option 2 can be built in its place without touching booking.
- **A token still stops working** when the photographer removes the app's access in their Google account,
  or after six months unused. The daily check already catches both and emails them; with the button, the
  fix becomes one click instead of a request to the operator.
- **Booking on Aspen's site is down between the switch and her reconnect.** Both happen in one sitting,
  with her at hand. Until she reconnects, putting the old client ID and secret back undoes it; after, her
  stored token belongs to the new client and going back would need a token made by hand.
- **The app is in "Testing" and nobody notices.** Everything appears to work for a week, then every
  connection fails at once. Step 1 exists to rule this out.

## What this plan does not include

Apple and Outlook calendars (option 3), choosing which of several calendars to use (it stays the person's
main one), and any change to how availability is worked out.

## Sources

- Google: [Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth)
- Google: [Unverified apps](https://support.google.com/cloud/answer/7454865)
- Google: [Publishing status, test users and the user cap](https://support.google.com/cloud/answer/15549945)
- Google: [Verification requirements](https://support.google.com/cloud/answer/13464321)
- Google: [Sharing calendars](https://developers.google.com/workspace/calendar/api/concepts/sharing)
- Google: [The secret calendar address](https://support.google.com/calendar/answer/37648)
- Review-time reports: [pyas.io guide](https://www.pyas.io/guides/google-oauth-verification-calendar)
- Vendor pricing (unconfirmed): [Cronofy](https://cronofy.com/api-pricing), [comparison](https://apiscout.dev/guides/nylas-vs-cronofy-vs-google-calendar-api-2026)
