import { subscriptions } from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session)
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

	const [sub] = await db
		.select()
		.from(subscriptions)
		.where(eq(subscriptions.userId, session.user.id))
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

	await db
		.update(subscriptions)
		.set({ status: 'cancelled' })
		.where(eq(subscriptions.id, sub.id))
	return NextResponse.json({ ok: true })
}
