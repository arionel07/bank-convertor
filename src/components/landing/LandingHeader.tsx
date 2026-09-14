import { LanguageSwitcher } from '@/components/buttons/language-switcher'
import { ThemeToggle } from '@/components/buttons/theme-toggle'
import { MobileMenu } from '@/components/modals/mobile-menu'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { getT } from '@/i18n/server'
import Link from 'next/link'

export async function LandingHeader() {
	const { t } = await getT()
	return (
		<header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
			<div className="flex h-14 items-center gap-2 px-4">
				<Link href="/" className="font-semibold text-lg">
					{t('common.appName')}
				</Link>

				{/* мобилка: только burger */}
				<div className="ml-auto sm:hidden">
					<MobileMenu />
				</div>

				{/* десктоп/планшет: всё как было */}
				<nav className="ml-auto hidden sm:flex items-center gap-1">
					<Button
						variant="ghost"
						className="h-10"
						render={<Link href="/price" />}
					>
						{t('nav.pricing')}
					</Button>
					<LanguageSwitcher />
					<ThemeToggle />
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
				</nav>
			</div>
		</header>
	)
}
