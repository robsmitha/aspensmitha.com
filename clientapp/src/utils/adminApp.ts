/**
 * Where this site is managed. Photos, stories, sessions and connections are edited in the shared admin app,
 * which has its own sign-in; nothing on this site needs anyone signed in.
 *
 * The old /admin addresses redirect there (see worker/src/adminRedirect.ts).
 */
export const ADMIN_URL = 'https://manage.smithadigital.com/s/aspensmitha'
