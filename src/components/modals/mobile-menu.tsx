'use client'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
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

export function MobileMenu() {
	const t = useTranslations()
	return (
		<Sheet>
			<SheetTrigger
				render={
					<Button variant="ghost" size="icon" className="h-10 w-10 sm:hidden" />
				}
			>
				<Menu size={20} />
			</SheetTrigger>
			<SheetContent side="right" className="w-72 p-5">
				<SheetHeader>
					<SheetTitle>{t('common.appName')}</SheetTitle>
				</SheetHeader>
				<nav className="grid gap-2 mt-6">
					<Link href="/blog" className="text-lg py-2">
						{t('nav.blog')}
					</Link>
					<Link href="/price" className="text-lg py-2">
						{t('nav.pricing')}
					</Link>
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
				</nav>
			</SheetContent>
		</Sheet>
	)
}
