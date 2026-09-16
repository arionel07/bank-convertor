import { CancelSubscriptionButton } from '@/components/buttons/cancel-subscription-button'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { subscriptions } from '@/db/schema'
import { Link } from '@/i18n/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'
import { FREE_MONTHLY_LIMIT, getMonthlyUsageCount, isProUser } from '@/lib/usage'
import { eq } from 'drizzle-orm'
import { getLocale, getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
	// getSession() is cache()-wrapped (src/lib/session.ts) — this is the
	// same call the (app) layout already made for this request, deduped to
	// one DB round-trip instead of two.
	const [t, locale, session] = await Promise.all([
		getTranslations(),
		getLocale(),
		getSession()
	])
	const userId = session!.user.id

	// All three independent of each other — fire together instead of
	// waiting on the subscription query before starting the other two.
	const [subs, pro, used] = await Promise.all([
		db.select().from(subscriptions).where(eq(subscriptions.userId, userId)),
		isProUser(userId),
		getMonthlyUsageCount(userId)
	])

	// The row (if any) currently granting access — same rule as
	// hasActiveProAccess in src/lib/usage.ts: active, or cancelled but
	// still inside the paid-for period. Shown for its own info (plan
	// name, whether it's already cancelled) — `pro` above is what
	// actually gates the usage card.
	const now = new Date()
	const currentSub = subs.find(
		s =>
			s.plan === 'pro' &&
			(s.status === 'active' ||
				(s.status === 'cancelled' && s.endsAt !== null && s.endsAt > now))
	)

	return (
		<div className="grid gap-4 max-w-2xl mx-auto">
			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle className="text-2xl">{t('nav.dashboard')}</CardTitle>
					<CardDescription>
						{session!.user.name || session!.user.email}
					</CardDescription>
				</CardHeader>
			</Card>

			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle>{t('usage.title')}</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-2">
					{pro ? (
						<p className="text-sm text-muted-foreground">
							{t('usage.unlimited')}
						</p>
					) : (
						<>
							<p className="text-sm text-muted-foreground">
								{t('usage.free', { used, limit: FREE_MONTHLY_LIMIT })}
							</p>
							<Progress value={(used / FREE_MONTHLY_LIMIT) * 100} />
						</>
					)}
				</CardContent>
			</Card>

			<Card className="shadow-lg">
				<CardHeader>
					<CardTitle>{t('price.title')}</CardTitle>
				</CardHeader>
				<CardContent>
					{currentSub ? (
						<div className="grid gap-4">
							<p className="text-sm text-muted-foreground capitalize">
								{currentSub.plan}
							</p>
							{currentSub.status === 'cancelled' && currentSub.endsAt ? (
								<p className="text-sm text-amber-600 dark:text-amber-400">
									{t('billing.cancelledUntil', {
										date: currentSub.endsAt.toLocaleDateString(locale)
									})}
								</p>
							) : (
								<CancelSubscriptionButton />
							)}
						</div>
					) : (
						<Button
							nativeButton={false}
							render={<Link href="/price" />}
							className="w-full h-11"
						>
							{t('price.choose')}
						</Button>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
