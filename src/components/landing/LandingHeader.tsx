import { LanguageSwitcher } from '@/components/buttons/language-switcher'
import { SignOutButton } from '@/components/buttons/sign-out-button'
import { ThemeToggle } from '@/components/buttons/theme-toggle'
import { MobileMenu } from '@/components/modals/mobile-menu'
import { LinkButton } from '@/components/ui/link-button'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/lib/routes'
import { hasSessionCookie } from '@/lib/session'
import { getTranslations } from 'next-intl/server'

export async function LandingHeader() {
	// Cookie-only check (no DB call) — this header renders on every public
	// page (landing, blog, price, converter), so a real DB-verified session
	// lookup here would add a network round-trip to the critical path of
	// all of them just to decide "Sign in" vs. "Dashboard". It's only used
	// for that cosmetic choice; protected routes verify for real.
	const [t, isSignedIn] = await Promise.all([
		getTranslations(),
		hasSessionCookie()
	])

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
					<LinkButton href="/converter" variant="ghost" className="h-10">
						{t('nav.converter')}
					</LinkButton>
					<LinkButton href="/blog" variant="ghost" className="h-10">
						{t('nav.blog')}
					</LinkButton>
					<LinkButton href="/price" variant="ghost" className="h-10">
						{t('nav.pricing')}
					</LinkButton>
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
