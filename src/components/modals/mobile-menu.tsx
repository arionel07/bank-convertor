'use client'
import { SignOutButton } from '@/components/buttons/sign-out-button'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import { LinkPendingHint } from '@/components/ui/link-pending-hint'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from '@/components/ui/sheet'
import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/lib/routes'
import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function MobileMenu({ isSignedIn }: { isSignedIn: boolean }) {
	const t = useTranslations()
	return (
		<Sheet>
			<SheetTrigger
				render={
					<Button variant="ghost" size="icon" className="h-10 w-10 lg:hidden" />
				}
			>
				<Menu size={20} />
			</SheetTrigger>
			<SheetContent side="right" className="w-72 p-5">
				<SheetHeader>
					<SheetTitle>{t('common.appName')}</SheetTitle>
				</SheetHeader>
				<nav className="grid gap-2 mt-6">
					<Link href="/converter" className="text-lg py-2">
						{t('nav.converter')}
						<LinkPendingHint />
					</Link>
					<Link href="/blog" className="text-lg py-2">
						{t('nav.blog')}
						<LinkPendingHint />
					</Link>
					<Link href="/price" className="text-lg py-2">
						{t('nav.pricing')}
						<LinkPendingHint />
					</Link>
					{isSignedIn ? (
						<>
							<Link href={ROUTES.dashboard} className="text-lg py-2">
								{t('nav.dashboard')}
								<LinkPendingHint />
							</Link>
							<SignOutButton
								compact={false}
								variant="outline"
								className="w-full h-11 mt-4"
							/>
						</>
					) : (
						<>
							<LinkButton
								href="/login"
								variant="outline"
								className="w-full h-11 mt-4"
							>
								{t('nav.signIn')}
							</LinkButton>
							<LinkButton href={ROUTES.register} className="w-full h-11">
								{t('auth.register.title')}
							</LinkButton>
						</>
					)}
				</nav>
			</SheetContent>
		</Sheet>
	)
}
