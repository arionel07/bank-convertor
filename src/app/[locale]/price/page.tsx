import { CheckoutButton } from '@/components/buttons/checkout-button'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { LinkPendingHint } from '@/components/ui/link-pending-hint'
import { Link } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'
import { pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

export async function generateMetadata({
	params
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const [common, price] = await Promise.all([
		getTranslations({ locale, namespace: 'common' }),
		getTranslations({ locale, namespace: 'price' })
	])
	return pageMetadata({
		locale: locale as AppLocale,
		title: price('title'),
		description: price('subtitle'),
		path: '/price',
		siteName: common('appName')
	})
}

export default async function PricePage() {
	const t = await getTranslations()
	const locale = await getLocale()
	const plans = [
		{
			name: t('price.free.name'),
			price: '$0',
			originalPrice: null as string | null,
			features: [t('price.free.f1'), t('price.free.f2')],
			href: '/register',
			external: false
		},
		{
			name: t('price.pro.name'),
			price: '$8',
			// Display only — the actual charge comes from the Lemon Squeezy
			// variant behind LEMONSQUEEZY_PRO_VARIANT_ID, configured on
			// Lemon Squeezy's own dashboard, not here. Keep that variant's
			// price in sync with this string, or checkout will charge a
			// different amount than what's shown.
			originalPrice: '$10' as string | null,
			features: [t('price.pro.f1'), t('price.pro.f2')],
			// route handler, not a localized page — must not go through the
			// locale-prefixing <Link>; carries the locale so an unauthenticated
			// redirect back to /login lands on the right language.
			href: `/api/billing/checkout?plan=pro&locale=${locale}`,
			external: true
		}
	]

	return (
		<main>
			<LandingHeader />
			<div className="py-10 sm:py-16">
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
								<div className="flex items-center gap-2">
									<CardTitle>{plan.name}</CardTitle>
									{plan.originalPrice && (
										<Badge className="bg-primary/10 text-primary">
											{t('price.discountBadge')}
										</Badge>
									)}
								</div>
								<CardDescription className="text-3xl font-bold text-foreground">
									{plan.originalPrice && (
										<span className="text-lg font-normal text-muted-foreground line-through mr-1.5">
											{plan.originalPrice}
										</span>
									)}
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
									<CheckoutButton href={plan.href}>
										{t('price.choose')}
									</CheckoutButton>
								) : (
									<Button
										nativeButton={false}
										render={<Link href={plan.href} />}
										className="w-full h-11"
									>
										{t('price.choose')}
										<LinkPendingHint />
									</Button>
								)}
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
			<LandingFooter />
		</main>
	)
}
