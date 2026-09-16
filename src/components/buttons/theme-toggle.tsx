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
	// This is next-themes' own documented hydration-safety pattern (the
	// server can't know the client's actual theme, so nothing theme-
	// dependent may render before the first client commit) — the
	// react-hooks/set-state-in-effect rule flags any setState-in-effect
	// as a risk of cascading renders, but this one has an empty
	// dependency array and runs exactly once per mount, so there's
	// nothing to cascade.
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), [])

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
