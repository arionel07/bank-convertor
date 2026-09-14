import { subscriptions, usage } from '@/db/schema'
import { db } from '@/lib/db'
import { and, count, eq, gte } from 'drizzle-orm'

export const FREE_MONTHLY_LIMIT = 2

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1)
}

export async function isProUser(userId: string): Promise<boolean> {
	const [sub] = await db
		.select({ plan: subscriptions.plan, status: subscriptions.status })
		.from(subscriptions)
		.where(
			and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active'))
		)
	return sub?.plan === 'pro'
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
