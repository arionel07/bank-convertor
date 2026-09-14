'use client'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
	const { locale, setLocale } = useI18n()
	const next = locale === 'ru' ? 'en' : 'ru'

	return (
		<Button
			variant="ghost"
			size="sm"
			className="h-10 gap-1.5 px-3"
			aria-label="Language"
			onClick={() => setLocale(next)}
		>
			<Languages size={16} className="text-muted-foreground" />
			<span className="uppercase text-sm font-medium">{locale}</span>
		</Button>
	)
}
