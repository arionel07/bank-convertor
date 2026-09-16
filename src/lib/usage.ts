import { subscriptions, usage } from '@/db/schema'
import { db } from '@/lib/db'
import { and, count, eq, gte } from 'drizzle-orm'

export const FREE_MONTHLY_LIMIT = 2

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

type SubscriptionAccessInfo = {
	plan: string
	status: string
	endsAt: Date | null
}

/**
 * A cancelled subscription still grants access until the paid period
 * runs out — Lemon Squeezy flips status to 'cancelled' immediately on
 * cancellation (not just at the actual period end), but endsAt is the
 * date access should actually stop. Pulled out as a pure function
 * (rather than inlined in isProUser) so it's testable without a DB.
 *
 * A user can have more than one row here (e.g. an old cancelled/expired
 * subscription plus a newer one after resubscribing) — `subscriptionId`
 * is unique per row, `userId` isn't — so this checks whether *any* row
 * currently grants access, not just the first one a query happens to
 * return.
 */
export function hasActiveProAccess(
	subs: SubscriptionAccessInfo[],
	now: Date = new Date()
): boolean {
	return subs.some(
		sub =>
			sub.plan === 'pro' &&
			(sub.status === 'active' ||
				(sub.status === 'cancelled' && sub.endsAt !== null && sub.endsAt > now))
	)
}

export async function isProUser(userId: string): Promise<boolean> {
	const subs = await db
		.select({
			plan: subscriptions.plan,
			status: subscriptions.status,
			endsAt: subscriptions.endsAt
		})
		.from(subscriptions)
		.where(eq(subscriptions.userId, userId))
	return hasActiveProAccess(subs)
}

export async function getMonthlyUsageCount(userId: string): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(usage)
		.where(
			and(eq(usage.userId, userId), gte(usage.createdAt, startOfMonth(new Date())))
		)
	return row?.value ?? 0
}

/** Pro users always pass; free users get FREE_MONTHLY_LIMIT statements/month. */
export async function canConvert(userId: string): Promise<boolean> {
	if (await isProUser(userId)) return true
	return (await getMonthlyUsageCount(userId)) < FREE_MONTHLY_LIMIT
}

export async function recordUsage(userId: string, bankCode: string) {
	await db.insert(usage).values({ userId, bankCode })
}
