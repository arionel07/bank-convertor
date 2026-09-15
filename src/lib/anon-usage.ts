import { cookies } from 'next/headers'

const COOKIE_NAME = 'bc_anon_used'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180 // ~6 months

/**
 * Anonymous visitors (no account) get exactly one conversion, tracked by
 * a cookie rather than anything server-side — we never store the
 * uploaded file or a user id for them. Signing up resets the limit
 * (usage after that is tracked per-user in the `usage` table instead,
 * see src/lib/usage.ts).
 */
export async function hasUsedAnonymousConversion(): Promise<boolean> {
	const store = await cookies()
	return store.get(COOKIE_NAME)?.value === '1'
}

export async function markAnonymousConversionUsed(): Promise<void> {
	const store = await cookies()
	store.set(COOKIE_NAME, '1', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: MAX_AGE_SECONDS,
		path: '/'
	})
}
