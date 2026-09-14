import { cookies, headers } from 'next/headers'
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE,
	isLocale,
	localeFromAcceptLanguage,
	type Locale
} from './config'
import { dictionaries } from './dictionaries'
import { createTranslate } from './translate'

export async function getLocale(): Promise<Locale> {
	const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value
	if (isLocale(cookieLocale)) return cookieLocale

	const acceptLanguage = (await headers()).get('accept-language')
	const headerLocale = localeFromAcceptLanguage(acceptLanguage)
	if (headerLocale) return headerLocale

	return DEFAULT_LOCALE
}

export async function getDictionary() {
	const locale = await getLocale()
	return { locale, dict: dictionaries[locale] }
}

// Для серверных компонентов: const { t } = await getT()
export async function getT() {
	const { locale, dict } = await getDictionary()
	return { locale, t: createTranslate(dict) }
}
