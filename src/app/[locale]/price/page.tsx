import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'

export default async function PricePage() {
	const t = await getTranslations()
	const locale = await getLocale()
	const plans = [
		{
			name: t('price.free.name'),
			price: '$0',
			features: [t('price.free.f1'), t('price.free.f2')],
			href: '/register',
			external: false
		},
		{
			name: t('price.pro.name'),
			price: '$9',
			features: [t('price.pro.f1'), t('price.pro.f2')],
			// route handler, not a localized page — must not go through the
			// locale-prefixing <Link>; carries the locale so an unauthenticated
			// redirect back to /login lands on the right language.
			href: `/api/billing/checkout?plan=pro&locale=${locale}`,
			external: true
		}
	]

	return (
		<div className="min-h-dvh py-10 sm:py-16">
			<div className="text-center px-4 mb-8 sm:mb-12">
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
					{t('price.title')}
				</h1>
				<p className="text-muted-foreground mt-2">{t('price.subtitle')}</p>
			</div>
			{/* mobile-first: 1 колонка → 2 на sm */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 max-w-3xl mx-auto">
				{plans.map(plan => (
					<Card key={plan.name} className="shadow-lg">
						<CardHeader>
							<CardTitle>{plan.name}</CardTitle>
							<CardDescription className="text-3xl font-bold text-foreground">
								{plan.price}
								<span className="text-sm font-normal text-muted-foreground">
									{t('price.perMonth')}
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="grid gap-2 text-sm">
								{plan.features.map(f => (
									<li key={f} className="flex items-center gap-2">
										<span className="text-primary">✓</span>
										{f}
									</li>
								))}
							</ul>
						</CardContent>
						<CardFooter>
							{plan.external ? (
								<Button
									nativeButton={false}
									render={<a href={plan.href} />}
									className="w-full h-11"
								>
									{t('price.choose')}
								</Button>
							) : (
								<Button
									nativeButton={false}
									render={<Link href={plan.href} />}
									className="w-full h-11"
								>
									{t('price.choose')}
								</Button>
							)}
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	)
}
