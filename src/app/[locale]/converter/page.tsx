import { ConverterClient } from '@/components/converter/converter-client'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import type { AppLocale } from '@/i18n/routing'
import { pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
	params
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const [common, converter] = await Promise.all([
		getTranslations({ locale, namespace: 'common' }),
		getTranslations({ locale, namespace: 'converter' })
	])
	return pageMetadata({
		locale: locale as AppLocale,
		title: converter('title'),
		description: converter('subtitle'),
		path: '/converter',
		siteName: common('appName')
	})
}

export default function ConverterPage() {
	return (
		<main>
			<LandingHeader />
			<div className="px-4 py-10 sm:py-16">
				<ConverterClient />
			</div>
			<LandingFooter />
		</main>
	)
}
