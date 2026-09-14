import { LanguageSwitcher } from '@/components/buttons/language-switcher'
import { SignOutButton } from '@/components/buttons/sign-out-button'
import { ThemeToggle } from '@/components/buttons/theme-toggle'
import { Button } from '@/components/ui/button'
import { Link, redirect } from '@/i18n/navigation'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/routes'
import { getLocale, getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'

export const metadata = { robots: { index: false, follow: false } }

export default async function AppLayout({
	children
}: {
	children: React.ReactNode
}) {
	const session = await auth.api.getSession({ headers: await headers() })
	const locale = await getLocale()
	if (!session) redirect({ href: ROUTES.login, locale })
	const t = await getTranslations()

	return (
		<div className="min-h-dvh bg-base-200">
			<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
				<div className="flex h-14 items-center gap-2 px-4">
					<Link href={ROUTES.afterLogin} className="font-semibold text-lg">
						{t('common.appName')}
					</Link>
					<nav className="ml-auto flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							render={<Link href="/price" />}
							className="hidden sm:inline-flex h-10"
						>
							{t('nav.pricing')}
						</Button>
						<LanguageSwitcher />
						<ThemeToggle />
						{/* на мобиле email скрыт, как раньше */}
						<span className="hidden md:inline text-sm text-muted-foreground max-w-40 truncate">
							{session!.user.email}
						</span>
						<SignOutButton />
					</nav>
				</div>
			</header>
			<main className="container mx-auto p-4 sm:p-6">{children}</main>
		</div>
	)
}
