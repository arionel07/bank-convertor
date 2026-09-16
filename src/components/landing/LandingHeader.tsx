import { LanguageSwitcher } from '@/components/buttons/language-switcher'
import { SignOutButton } from '@/components/buttons/sign-out-button'
import { ThemeToggle } from '@/components/buttons/theme-toggle'
import { MobileMenu } from '@/components/modals/mobile-menu'
import { LinkButton } from '@/components/ui/link-button'
import { LinkPendingHint } from '@/components/ui/link-pending-hint'
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
			<div className="flex h-14 items-center px-4">
				{/* левая треть: лого. flex-1 делает эту и правую зону равными по
				    ширине, поэтому центральный nav оказывается реально по центру
				    шапки, а не просто "между" лого и действиями */}
				<div className="flex-1 flex items-center">
					<Link href="/" className="font-semibold text-lg whitespace-nowrap">
						{t('common.appName')}
						<LinkPendingHint />
					</Link>
				</div>

				{/* до lg (1024px) — вся эта шапка (лого + центр-nav + действия)
				    физически не помещается в одну строку без наложений, так
				    что до этой ширины просто гамбургер */}
				<div className="lg:hidden">
					<MobileMenu isSignedIn={isSignedIn} />
				</div>

				{/* десктоп: ссылки по центру, своей естественной ширины */}
				<nav className="hidden lg:flex items-center gap-1 shrink-0">
					<LinkButton href="/converter" variant="ghost" className="h-10">
						{t('nav.converter')}
					</LinkButton>
					<LinkButton href="/blog" variant="ghost" className="h-10">
						{t('nav.blog')}
					</LinkButton>
					<LinkButton href="/price" variant="ghost" className="h-10">
						{t('nav.pricing')}
					</LinkButton>
				</nav>

				{/* правая треть: язык/тема/аккаунт, прижаты к правому краю зоны */}
				<div className="flex-1 hidden lg:flex items-center justify-end gap-1">
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
				</div>
			</div>
		</header>
	)
}
