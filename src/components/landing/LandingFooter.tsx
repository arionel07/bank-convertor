import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function LandingFooter() {
	const t = await getTranslations()
	return (
		<footer className="border-t py-8 px-4">
			<div className="mx-auto max-w-5xl flex flex-col items-center gap-3 text-sm text-muted-foreground">
				<nav className="flex gap-4">
					<Link
						href="/price"
						className="hover:text-foreground transition-colors"
					>
						{t('nav.pricing')}
					</Link>
					<Link
						href="/login"
						className="hover:text-foreground transition-colors"
					>
						{t('nav.signIn')}
					</Link>
				</nav>
				<p>
					© {new Date().getFullYear()} {t('common.appName')} —{' '}
					{t('footer.rights')}
				</p>
			</div>
		</footer>
	)
}
