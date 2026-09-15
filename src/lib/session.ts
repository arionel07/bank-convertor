import { headers } from 'next/headers'
import { cache } from 'react'
import { getSessionCookie } from 'better-auth/cookies'
import { auth } from './auth'

/**
 * Full, DB-verified session — use this wherever the result gates access
 * (protected layouts, API routes, anything that reads session.user.id).
 *
 * Wrapped in React's cache(): within a single request/render pass, every
 * call here (same zero arguments) shares one result instead of firing a
 * separate DB round-trip each time. Without this, a route like /dashboard
 * — whose layout AND page both need the session — was hitting the
 * database twice for the same request.
 */
export const getSession = cache(async () => {
	return auth.api.getSession({ headers: await headers() })
})

/**
 * Cheap, cookie-only "is this visitor probably signed in?" check — no DB
 * call. Use this for cosmetic UI decisions only (e.g. which nav links to
 * show in a public page's header), never for anything that gates access:
 * a stale or tampered cookie can pass this check. Real protected routes
 * must still call getSession() (or auth.api.getSession directly) to
 * verify against the database.
 */
export async function hasSessionCookie(): Promise<boolean> {
	return getSessionCookie(await headers()) !== null
}
