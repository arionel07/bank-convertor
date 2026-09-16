import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import type { AppLocale } from '@/i18n/routing'
import { pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({
	params
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const [t, common] = await Promise.all([
		getTranslations({ locale, namespace: 'privacy' }),
		getTranslations({ locale, namespace: 'common' })
	])
	return pageMetadata({
		locale: locale as AppLocale,
		title: t('title'),
		description: t('subtitle'),
		path: '/privacy',
		siteName: common('appName')
	})
}

const SECTIONS = ['section1', 'section2', 'section3', 'section4', 'section5'] as const

export default async function PrivacyPage({
	params
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale as AppLocale)
	const t = await getTranslations('privacy')

	return (
		<main>
			<LandingHeader />
			<article className="px-4 py-12 sm:py-16 max-w-2xl mx-auto">
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
					{t('title')}
				</h1>
				<p className="text-muted-foreground mt-2">{t('subtitle')}</p>

				<div className="grid gap-8 mt-10">
					{SECTIONS.map(section => (
						<section key={section}>
							<h2 className="text-lg font-semibold">{t(`${section}.title`)}</h2>
							<p className="text-muted-foreground mt-2 leading-relaxed">
								{t(`${section}.body`)}
							</p>
						</section>
					))}
				</div>
			</article>
			<LandingFooter />
		</main>
	)
}
