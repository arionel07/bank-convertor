import { ReportIssueDialog } from '@/components/converter/report-issue-dialog'
import { LinkPendingHint } from '@/components/ui/link-pending-hint'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function LandingFooter() {
	const t = await getTranslations()
	return (
		<footer className="border-t">
			<div className="mx-auto max-w-5xl px-4 py-10 sm:py-14 flex flex-col items-center gap-6 text-center">
				<nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
					<Link
						href="/price"
						className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
					>
						{t('nav.pricing')}
						<LinkPendingHint />
					</Link>
					<Link
						href="/privacy"
						className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
					>
						{t('nav.privacy')}
						<LinkPendingHint />
					</Link>
					<ReportIssueDialog
						file={null}
						bankCode={null}
						trigger={
							<button
								type="button"
								className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
							>
								{t('nav.support')}
							</button>
						}
					/>
					<Link
						href="/login"
						className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
					>
						{t('nav.signIn')}
						<LinkPendingHint />
					</Link>
				</nav>
				<p className="text-xs text-muted-foreground">
					© {new Date().getFullYear()} {t('common.appName')} —{' '}
					{t('footer.rights')}
				</p>
			</div>
		</footer>
	)
}
