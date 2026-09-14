'use client'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Languages } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

export function LanguageSwitcher() {
	const t = useTranslations('lang')
	const locale = useLocale()
	const router = useRouter()
	const pathname = usePathname()
	const params = useParams()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						className="h-10 gap-1.5 px-3"
						aria-label={t('switch')}
					/>
				}
			>
				<Languages size={16} className="text-muted-foreground" />
				<span className="uppercase text-sm font-medium">{locale}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{routing.locales.map(next => (
					<DropdownMenuItem
						key={next}
						disabled={next === locale}
						onClick={() =>
							router.replace(
								// @ts-expect-error -- pathname может содержать динамические
								// сегменты (например /blog/[slug]) с реальными значениями params
								{ pathname, params },
								{ locale: next }
							)
						}
					>
						{t(next)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
