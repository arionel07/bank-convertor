import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LinkButton } from '@/components/ui/link-button'
import { FileText, PenLine, Upload } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'

const FEATURES = [
	{ icon: Upload, key: 'f1' as const },
	{ icon: PenLine, key: 'f2' as const },
	{ icon: FileText, key: 'f3' as const }
]

export default async function Home({
	params
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale as AppLocale)
	const t = await getTranslations('landing')

	return (
		<main>
			<LandingHeader />
			<section className="px-4 py-20 sm:py-28 text-center">
				<span className="inline-block rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground mb-4">
					{t('hero.badge')}
				</span>
				<h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
					{t('hero.title')}
				</h1>
				<p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
					{t('hero.subtitle')}
				</p>
				<div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
					<LinkButton href="/converter" className="rounded-full h-12 px-8">
						{t('hero.ctaPrimary')}
					</LinkButton>
					<LinkButton
						href="/price"
						variant="outline"
						className="rounded-full h-12 px-8"
					>
						{t('hero.ctaSecondary')}
					</LinkButton>
				</div>
			</section>
			<section className="px-4 py-12 sm:py-16 max-w-5xl mx-auto w-full">
				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-8">
					{t('features.title')}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					{FEATURES.map(({ icon: Icon, key }) => (
						<div key={key} className="rounded-2xl border p-6">
							<Icon className="text-primary mb-3" size={24} />
							<h3 className="font-semibold mb-1">
								{t(`features.${key}.title`)}
							</h3>
							<p className="text-sm text-muted-foreground">
								{t(`features.${key}.desc`)}
							</p>
						</div>
					))}
				</div>
			</section>
			<CtaSection />
			<LandingFooter />
		</main>
	)
}
