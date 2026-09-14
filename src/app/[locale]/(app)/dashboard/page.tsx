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
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { FREE_MONTHLY_LIMIT, getMonthlyUsageCount, isProUser } from '@/lib/usage'
import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'

export default async function DashboardPage() {
	const t = await getTranslations()
	const session = await auth.api.getSession({ headers: await headers() })
	const [sub] = await db
		.select()
		.from(subscriptions)
		.where(eq(subscriptions.userId, session!.user.id))
	const [pro, used] = await Promise.all([
		isProUser(session!.user.id),
		getMonthlyUsageCount(session!.user.id)
	])

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
					{sub && sub.status === 'active' ? (
						<div className="grid gap-4">
							<p className="text-sm text-muted-foreground capitalize">
								{sub.plan}
							</p>
							<CancelSubscriptionButton />
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
