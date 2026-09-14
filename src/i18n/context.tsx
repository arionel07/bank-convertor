'use client'

import { createContext, useContext, useMemo } from 'react'
import { LOCALE_COOKIE, type Locale } from './config'
import type { Dictionary } from './dictionaries/ru'
import { createTranslate, type TranslateFn } from './translate'

type I18nContextValue = {
	locale: Locale
	t: TranslateFn
	setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
	locale,
	dict,
	children
}: {
	locale: Locale
	dict: Dictionary
	children: React.ReactNode
}) {
	const value = useMemo<I18nContextValue>(
		() => ({
			locale,
			t: createTranslate(dict),
			setLocale: next => {
				document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
				window.location.reload()
			}
		}),
		[locale, dict]
	)

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
	const ctx = useContext(I18nContext)
	if (!ctx) throw new Error('useI18n must be used within I18nProvider')
	return ctx
}
