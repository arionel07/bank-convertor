import { subscriptions } from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session)
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

	const [sub] = await db
		.select()
		.from(subscriptions)
		.where(
			and(
				eq(subscriptions.userId, session.user.id),
				eq(subscriptions.status, 'active')
			)
		)
	if (!sub?.subscriptionId)
		return NextResponse.json({ error: 'no subscription' }, { status: 404 })

	const res = await fetch(
		`https://api.lemonsqueezy.com/v1/subscriptions/${sub.subscriptionId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
				Accept: 'application/vnd.api+json'
			}
		}
	)
	if (!res.ok)
		return NextResponse.json({ error: 'cancel failed' }, { status: 502 })

	// Lemon Squeezy's response is the updated subscription, including the
	// ends_at date access should actually stop at — read it from here
	// rather than only from the async webhook, so a paid grace period
	// (see hasActiveProAccess in src/lib/usage.ts) is recorded immediately
	// instead of racing whichever arrives first.
	const body = await res.json().catch(() => null)
	const endsAt = body?.data?.attributes?.ends_at

	await db
		.update(subscriptions)
		.set({ status: 'cancelled', endsAt: endsAt ? new Date(endsAt) : null })
		.where(eq(subscriptions.id, sub.id))
	return NextResponse.json({ ok: true })
}
