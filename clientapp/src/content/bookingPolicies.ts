/**
 * Policies shown on every session's booking page (behind "Read more") and
 * agreed to before booking. Edit the wording here; each entry is one section,
 * and each string in `paragraphs` is one paragraph.
 */
export interface BookingPolicy {
  id: string
  title: string
  paragraphs: string[]
}

export const BOOKING_POLICIES: BookingPolicy[] = [
  {
    id: 'payment-policy',
    title: 'Payment Policy',
    paragraphs: [
      'A partial deposit is required to reserve your session. Deposits are fully refundable for cancellations made more than 24 hours before your session. Cancellations made within 24 hours of your session are non-refundable, except in cases beyond your control, such as weather.',
      'The remaining balance is due in full by the end of the session, before your photos are delivered.',
    ],
  },
  {
    id: 'gallery-policy',
    title: 'Gallery Policy',
    paragraphs: [
      "Your edited photos will be delivered within 10–14 days of your session through a private, password-protected online gallery. You'll have unlimited access for 3 weeks to download your images in print or web resolution.",
      'Need your photos sooner? Mention it in the message box when booking, and we can discuss a rush option.',
    ],
  },
]
