import { LinkButton } from '@/components/ui/link-button'
import { getTranslations } from 'next-intl/server'

export async function CtaSection() {
	const t = await getTranslations()
	return (
		<section className="px-4 py-12 sm:py-20">
			<div className="max-w-3xl mx-auto rounded-2xl border bg-muted/40 px-6 py-12 sm:py-16 text-center">
				<h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
					{t('landing.cta.title')}
				</h2>
				<p className="mt-3 text-muted-foreground max-w-md mx-auto">
					{t('landing.cta.subtitle')}
				</p>
				<div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
					<LinkButton href="/register" className="h-12 px-8">
						{t('auth.register.title')}
					</LinkButton>
					<LinkButton href="/login" variant="outline" className="h-12 px-8">
						{t('nav.signIn')}
					</LinkButton>
				</div>
			</div>
		</section>
	)
}
