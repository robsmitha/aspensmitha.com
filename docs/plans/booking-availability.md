# Booking availability: a page for when a site can be booked

Status: built and deployed 2026-11-27 (Elysian 0.0.90, elysian-platform `d0eccf4`). Not yet checked in a browser: saving from the page on `cloud-site` and seeing the booking calendar follow.
Mockup: https://claude.ai/artifact/6fdMXsZd4UaidQKs6sbz1E (days-off inputs in the mockup are not being built; see below).

## Why

The booking calendar offers start times from 7:30 to 10:30 AM and 4:00 to 6:00 PM, a week to three months out,
and takes a day off the page as soon as anything is on the owner's Google Calendar. All of that is the default
of `BookingSettings` in Elysian. A site can override it only by hand-editing its `TenantSetting` row for the
`Booking` section. The one exception is the time zone, which has a panel on the Sessions page.

Owners shoot differently: mornings only, golden hour only, two sessions a day, weekends only. They need to set
this themselves.

## Decisions (owner, 2026-11-27)

1. **Day limit is split.** "Sessions a day, at most" counts only bookings. A separate choice says what other
   calendar events do: close the whole day (today's behaviour) or block only the time they cover.
2. **Same hours every day.** One set of start ranges, plus a switch per day of the week. No per-day hours.
3. **Whole site only.** No per-session hours.
4. **Time zone moves** from the Sessions page to the new page.
5. **No days-off inputs.** The page explains that blocking a day on Google Calendar takes it off the booking page.

## What the page has

A new drawer item, **Availability**, under Settings, shown only to sites with the Booking module.

| Control | Setting | Default (unchanged from today) |
|---|---|---|
| Days you shoot (seven switches) | `Days` (new) | all seven |
| Hours a session can start (1 to 4 ranges) | `StartWindows` | 07:30–10:30, 16:00–18:00 |
| Every session finishes by | `LatestEnd` | 20:00 |
| Offer a start time every 15 / 30 / 60 min | `SlotIncrementMinutes` | 30 |
| Sessions a day, at most (1–4, or no limit) | `MaxSessionsPerDay` (new) | 1 |
| Time kept clear around each session | `BufferMinutes` | 0 |
| Other things on your calendar | `OtherEvents` (new): `CloseDay` or `BlockTime` | `CloseDay` |
| Earliest a client can book | `MinimumNoticeDays` | 7 |
| Latest a client can book | `HorizonMonths` | 3 |
| Time zone | `TimeZone` | America/New_York |
| Days off | none: a paragraph about blocking the day in Google Calendar | |

Beside the form, a **"What a client sees"** panel lists the start times a session of a chosen length would get
on a day the owner shoots, worked out in the browser from the unsaved form. It is a guide: it knows nothing of
the calendar. It says so.

## The rule that must hold

**A site that never opens the page behaves exactly as it does today.** Aspen's site has no booking hours of its
own, so it runs on the defaults. Every default above reproduces today's result:

- `MaxSessionsPerDay = 1` with `OtherEvents = CloseDay`: one booking fills the day, any other event closes it.
  That is today's "any event at all closes the day".
- `Days` left out means every day.

`MaxEventsPerDay` is deleted. The owner checked production on 2026-11-27: the only `Booking` row is Aspen's,
and it sets nothing but the two email addresses, so no site depends on it.

## Elysian

Everything below is in the package; hosts stay thin.

### Telling bookings from other events

`CalendarEvent` gains two facts, and `GoogleCalendarService.GetEventsAsync` asks Google for them
(`extendedProperties/private`, `transparency` added to `Fields`):

- `IsBooking`: the event carries the private property `elysianBooking = true`, which `CreateBookingCommand`
  already writes. Pending and confirmed bookings both count.
- `IsFree`: the owner marked it "Free" in Google Calendar (`transparency = transparent`).

A session the owner adds to the calendar by hand is not tagged, so it is an "other event". With `CloseDay` it
closes the day, as now. With `BlockTime` it blocks its own time but does not count toward the session limit.
The page says this in the hint under the choice.

### `BookingSettings` / `BookingRules`

- New: `Days` (list of day names; empty or missing = all), `MaxSessionsPerDay` (0 = no limit), `OtherEvents`.
- `BookingRules.FromSettings` parses and checks them. It stays the single place a bad value fails loudly.

### `SlotCalculator`

Per day, in this order:

1. Day of the week switched off: no times.
2. Bookings that day `>= MaxSessionsPerDay` (when a limit is set): no times.
3. `OtherEvents = CloseDay` and any non-booking event touches the day: no times. An event marked Free still
   closes the day here, because that is what happens today.
4. Otherwise step through the start ranges as now. A start time is dropped when it is in the past, ends after
   `LatestEnd`, or comes within `BufferMinutes` of a booking or, under `BlockTime`, of another busy event.
   Under `BlockTime`, events marked Free and all-day events not marked Busy are ignored.

`CreateBookingCommand` re-checks a submitted time through the same calculator, so showing and accepting cannot
disagree. Two clients racing for the last session of a day is already handled there; the test for it gains a
case with a limit of 2.

### Reading and saving

- `GetBookingAvailabilitySettingsQuery` → the current values (tenant row over defaults) plus the time zone list.
- `SaveBookingAvailabilitySettingsCommand` → validates, writes only these properties into the tenant's
  `Booking` JSON (leaving the email addresses and anything else alone), and clears the settings cache, the way
  `SetBookingTimeZoneCommand` does. Both carry the same authorization and `[RequiresModule(Booking)]` as the
  time-zone requests.
- Validation, with messages an owner can act on: at least one day; 1–4 ranges; each range starts at or before
  it ends; ranges don't overlap; times on the quarter hour; `LatestEnd` after the earliest start; increment one
  of 15/30/60; limit 0–4; buffer 0–240; notice 0–60 days; horizon 1–12 months; time zone from the list.
- `GetBookingTimeZoneQuery` / `SetBookingTimeZoneCommand` stay until the admin no longer calls them, then go
  in a later release.

### Tests (`tests/Elysian.Tests/Booking/`)

- Defaults give the same slots as before for every existing `SlotCalculator` test (no expectations edited).
- Day switches; limit of 2 with one and two bookings; `CloseDay` vs `BlockTime` with a timed event, an all-day
  event, a Free event; buffer around a booking.
- Save: merges into existing JSON without losing other keys, case-insensitive property names, each validation
  rule, cache cleared.

## elysian-platform

- `functions/BookingFunctions.cs`: `GET` and `PUT manage/booking/availability`. A few lines each.
- `admin/src/site.ts`: the drawer item, for sites with Booking.
- `admin/src/pages/Availability.vue` and `admin/src/utils/availability.ts` (form model, validation mirroring
  the backend's, and the preview's slot steps). The preview's steps are tested against a table of cases that
  the Elysian tests also use, so the two can't drift without a test failing.
- `admin/src/pages/Sessions.vue`: `BookingTimeZonePanel` removed; a one-line link to Availability in its place.
- Unsaved changes: the page warns before leaving, like Look and wording.

No change to the site templates or the Worker. The booking page already takes its times, first and last
bookable dates and time zone from the availability API.

## What clients notice

Nothing on a site that doesn't change its settings. On one that does, the booking calendar offers the new
times on the next request; availability responses are not cached at the edge.

## Order of work

1. ~~Owner runs the SQL check.~~ Done: no row sets `MaxEventsPerDay`.
2. Elysian: `CalendarEvent` facts, settings, rules, calculator, query and command, tests. Release.
3. elysian-platform: endpoints, page, drawer item, Sessions page change. Deploy.
4. Check on `cloud-site`: change the ranges and limit, see the booking calendar follow; make a booking with a
   limit of 2 and see the day stay open; put a non-booking event on the calendar under each choice.
5. Check Aspen's site still offers the same times as before the release.

## Not in this plan

- Days-off inputs, hours per day of the week, hours per session (decisions 2, 3, 5).
- Booking email addresses: also in `BookingSettings`, not about time, stay where they are.
- aspensmitha.com's old client app: it reads the same availability API, so it follows the settings without
  changes.
