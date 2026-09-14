import { subscriptions } from '@/db/schema'
import { captureError } from '@/lib/capture-error'
import { db } from '@/lib/db'
import { createHmac, timingSafeEqual } from 'crypto'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const rawBody = await req.text()
	const signature = req.headers.get('x-signature') ?? ''

	const digest = createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
		.update(rawBody)
		.digest('hex')

	const a = Buffer.from(signature)
	const b = Buffer.from(digest)
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
	}

	try {
		const event = JSON.parse(rawBody)
		const attrs = event?.data?.attributes ?? {}
		const userId = attrs?.checkout_data?.custom?.user_id
		const name = event?.meta?.event_name

		if (!userId) return NextResponse.json({ ok: true }) // не наша подписка

		if (name === 'subscription_created' || name === 'subscription_updated') {
			await db
				.insert(subscriptions)
				.values({
					userId,
					customerId: String(attrs.customer_id ?? ''),
					subscriptionId: String(event.data.id),
					plan: 'pro',
					status: attrs.status ?? 'active',
					renewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
					endsAt: attrs.ends_at ? new Date(attrs.ends_at) : null
				})
				.onConflictDoUpdate({
					target: subscriptions.subscriptionId,
					set: {
						status: attrs.status ?? 'active',
						renewsAt: attrs.renews_at ? new Date(attrs.renews_at) : null,
						endsAt: attrs.ends_at ? new Date(attrs.ends_at) : null
					}
				})
		}

		if (name === 'subscription_cancelled' || name === 'subscription_expired') {
			await db
				.update(subscriptions)
				.set({
					status: name === 'subscription_cancelled' ? 'cancelled' : 'expired'
				})
				.where(eq(subscriptions.subscriptionId, String(event.data.id)))
		}

		return NextResponse.json({ ok: true })
	} catch (e) {
		await captureError(e, {
			source: 'server',
			url: '/api/webhooks/lemonsqueezy'
		})
		// 200, чтобы Lemon Squeezy не ретраил; ошибка уже в таблице errors
		return NextResponse.json({ ok: true })
	}
}
