/**
 * "How did you hear about us?" options shared by the contact and booking forms.
 * The server stores whatever text is sent (max 200 characters), so these can change freely.
 */
import { maxLength, required, type Rule } from '@/utils/formRules'

export const OTHER_REFERRAL_SOURCE = 'Other (please specify)'

export const REFERRAL_SOURCES = [
  'Facebook',
  'Instagram',
  'Pinterest',
  'TikTok',
  'Google Search',
  'Friend/Family',
  OTHER_REFERRAL_SOURCE,
]

export const referralSourceRules: Rule[] = [required('Please let us know how you heard about us.')]

/** Only applies when "Other" is picked; `source` returns the current dropdown choice */
export const referralOtherRules = (source: () => string): Rule[] => [
  value => source() !== OTHER_REFERRAL_SOURCE || !!value?.trim() || 'Please let us know where you heard about us.',
  maxLength(190, 'Your answer'),
]

/** Value sent to the server, e.g. "Instagram" or "Other: a wedding fair" */
export function referralSourceValue(source: string, other: string): string {
  return source === OTHER_REFERRAL_SOURCE ? `Other: ${other.trim()}` : source
}
