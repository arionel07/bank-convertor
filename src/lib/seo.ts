import { routing, type AppLocale } from '@/i18n/routing'
import type { Metadata } from 'next'

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'

function localizedUrl(locale: AppLocale, path: string): string {
	return `${SITE_URL}/${locale}${path}`
}

/** hreflang alternates for every locale a page exists in, plus x-default. */
export function localeAlternates(
	path: string,
	locales: readonly AppLocale[] = routing.locales
): Record<string, string> {
	const languages: Record<string, string> = {}
	for (const locale of locales) languages[locale] = localizedUrl(locale, path)
	languages['x-default'] = localizedUrl(routing.defaultLocale, path)
	return languages
}

// Next.js doesn't merge nested openGraph/twitter between a parent layout and
// a page — a page's own `export const metadata` fully REPLACES the parent's.
// So every page needs to set the full set of fields (type, siteName, card,
// etc.), not just title/description — this helper does that consistently
// and keeps every page's canonical + hreflang alternates correct.
export function pageMetadata({
	locale,
	title,
	description,
	path,
	siteName,
	robots,
	locales
}: {
	locale: AppLocale
	title: string
	description: string
	path: string
	siteName: string
	robots?: Metadata['robots']
	/** Restrict hreflang alternates to locales this specific page actually
	 * exists in (e.g. a blog post only published in some languages). */
	locales?: readonly AppLocale[]
}): Metadata {
	const canonical = localizedUrl(locale, path)
	return {
		// absolute: every page already includes the brand name in its own
		// title — without this the root layout's '%s · bank-converter'
		// template would apply again and double it up.
		title: { absolute: title },
		description,
		alternates: {
			canonical,
			languages: localeAlternates(path, locales)
		},
		...(robots ? { robots } : {}),
		openGraph: {
			type: 'website',
			siteName,
			title,
			description,
			url: canonical,
			locale
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description
		}
	}
}

// JSON-LD может содержать пользовательский текст (напр. имя проекта) — экранируем
// "<", иначе буквальный "</script>" внутри значения преждевременно закроет тег.
export function jsonLdScript(data: unknown): string {
	return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function breadcrumbJsonLd(
	siteName: string,
	trail: { name: string; path: string }[]
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: siteName, path: '' }, ...trail].map(
			(item, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: item.name,
				item: `${SITE_URL}${item.path}`
			})
		)
	}
}
