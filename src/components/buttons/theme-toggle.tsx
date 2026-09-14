'use client'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
	const t = useTranslations('theme')
	const { resolvedTheme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), []) // гидрация: до маунта не рендерим иконку

	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-10 w-10"
			aria-label={t('toggle')}
			onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
		>
			{mounted &&
				(resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
		</Button>
	)
}
