/**
 * Validation rules shared by the public forms (contact, booking). They mirror the
 * server-side limits in Elysian's commands; the server re-validates everything.
 */
export type Rule = (value: string) => true | string

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_PATTERN = /^[0-9+()\-.\s]{7,30}$/
export const MESSAGE_MAX = 5000

export const required = (message: string): Rule => value => !!value?.trim() || message

export const maxLength = (max: number, label: string): Rule => value =>
  (value?.length ?? 0) <= max || `${label} must be ${max} characters or fewer.`

export const nameRules: Rule[] = [required('Please enter your name.'), maxLength(100, 'Name')]

export const emailRules: Rule[] = [
  required('Please enter your email.'),
  value => EMAIL_PATTERN.test(value.trim()) || 'Please enter a valid email address.',
  maxLength(320, 'Email'),
]

/** Optional, but must look like a phone number when given */
export const phoneRules: Rule[] = [value => !value?.trim() || PHONE_PATTERN.test(value.trim()) || 'Please enter a valid phone number.']

export const messageRules: Rule[] = [maxLength(MESSAGE_MAX, 'Message')]

/**
 * Server validation errors are keyed by the C# property name (e.g. "Name"),
 * so camelCase them to match form field names
 */
export function camelCaseErrors(errors: Map<string, string[]> | undefined): Map<string, string[]> {
  return new Map(
    Array.from(errors ?? [], ([key, messages]) => [key.charAt(0).toLowerCase() + key.slice(1), messages] as const)
  )
}
