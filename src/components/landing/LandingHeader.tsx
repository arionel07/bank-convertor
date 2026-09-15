import { LanguageSwitcher } from '@/components/buttons/language-switcher'
import { SignOutButton } from '@/components/buttons/sign-out-button'
import { ThemeToggle } from '@/components/buttons/theme-toggle'
import { MobileMenu } from '@/components/modals/mobile-menu'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { Link } from '@/i18n/navigation'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/routes'
import { getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'

export async function LandingHeader() {
	const [t, session] = await Promise.all([
		getTranslations(),
		auth.api.getSession({ headers: await headers() })
	])
	const isSignedIn = !!session

	return (
		<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
			<div className="flex h-14 items-center gap-2 px-4">
				<Link href="/" className="font-semibold text-lg">
					{t('common.appName')}
				</Link>

				{/* мобилка: только burger */}
				<div className="ml-auto sm:hidden">
					<MobileMenu isSignedIn={isSignedIn} />
				</div>

				{/* десктоп/планшет: всё как было */}
				<nav className="ml-auto hidden sm:flex items-center gap-1">
					<Button
						variant="ghost"
						className="h-10"
						render={<Link href="/converter" />}
					>
						{t('nav.converter')}
					</Button>
					<Button
						variant="ghost"
						className="h-10"
						render={<Link href="/blog" />}
					>
						{t('nav.blog')}
					</Button>
					<Button
						variant="ghost"
						className="h-10"
						render={<Link href="/price" />}
					>
						{t('nav.pricing')}
					</Button>
					<LanguageSwitcher />
					<ThemeToggle />
					{isSignedIn ? (
						<>
							<LinkButton
								href={ROUTES.dashboard}
								variant="ghost"
								className="h-10 rounded-full"
							>
								{t('nav.dashboard')}
							</LinkButton>
							<SignOutButton />
						</>
					) : (
						<>
							<LinkButton
								href="/login"
								variant="ghost"
								className="h-10 rounded-full"
							>
								{t('nav.signIn')}
							</LinkButton>
							<LinkButton href="/register" className="h-10 rounded-full">
								{t('auth.register.title')}
							</LinkButton>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}
