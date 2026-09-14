export const LOCALES = ['ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_COOKIE = 'app-locale'
// export const LOCALE_COOKIE = 'slyshno-locale'

export function isLocale(value: string | undefined | null): value is Locale {
	return !!value && (LOCALES as readonly string[]).includes(value)
}

// "en-US,en;q=0.9,ru;q=0.8" -> "en"
export function localeFromAcceptLanguage(header: string | null): Locale | null {
	if (!header) return null
	const tags = header
		.split(',')
		.map(part => part.trim().split(';')[0]?.toLowerCase())
		.filter(Boolean)
	for (const tag of tags) {
		const primary = tag.split('-')[0]
		if (isLocale(primary)) return primary
	}
	return null
}
