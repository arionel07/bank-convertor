'use client'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n/context'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
	const { t } = useI18n()
	const { resolvedTheme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), []) // гидрация: до маунта не рендерим иконку

	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-10 w-10"
			aria-label={t('theme.toggle')}
			onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
		>
			{mounted &&
				(resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
		</Button>
	)
}
