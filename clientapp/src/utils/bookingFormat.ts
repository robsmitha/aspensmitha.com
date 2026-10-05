/**
 * Display helpers for sessions and booking times. Times are always shown in the
 * visitor's own (browser) time zone.
 */
import type { BookingSession } from '@/store/sessions'

export function formatPrice(session: Pick<BookingSession, 'price' | 'isPriceFrom'>): string {
  if (session.price == null) return 'Inquire'
  const amount = session.price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: session.price % 1 === 0 ? 0 : 2,
  })
  return session.isPriceFrom ? `${amount}+` : amount
}

/** "30 min", "1 hr", "1.5 hrs", "3 hrs" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr${hours === 1 ? '' : 's'}`
}

/** Paragraphs separated by blank lines */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? '').split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean)
}

/** The visitor's IANA time zone, e.g. "America/Chicago" */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** "Central Time" (falls back to "CDT"-style names on older browsers) */
export function timeZoneLabel(date = new Date()): string {
  for (const timeZoneName of ['longGeneric', 'long'] as const) {
    try {
      const part = new Intl.DateTimeFormat('en-US', { timeZoneName }).formatToParts(date).find(p => p.type === 'timeZoneName')
      if (part) return part.value
    } catch { /* option not supported here */ }
  }
  return browserTimeZone()
}

/** Local calendar-date key, e.g. "2026-10-18" */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "2026-10-18" as a local Date at midnight (not UTC, which would shift the day) */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** "Sunday, October 18, 2026" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/** "7:30 AM" */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
