import { routing, type AppLocale } from '@/i18n/routing'
import { getAllSlugs } from '@/lib/blog'
import { localeAlternates, SITE_URL } from '@/lib/seo'
import type { MetadataRoute } from 'next'

function localizedUrl(locale: AppLocale, path: string): string {
	return `${SITE_URL}/${locale}${path}`
}

export default function sitemap(): MetadataRoute.Sitemap {
	const entries: MetadataRoute.Sitemap = []

	for (const locale of routing.locales) {
		entries.push({
			url: localizedUrl(locale, ''),
			changeFrequency: 'weekly',
			priority: 1,
			alternates: { languages: localeAlternates('') }
		})
		entries.push({
			url: localizedUrl(locale, '/converter'),
			changeFrequency: 'weekly',
			priority: 0.9,
			alternates: { languages: localeAlternates('/converter') }
		})
		entries.push({
			url: localizedUrl(locale, '/price'),
			changeFrequency: 'monthly',
			priority: 0.8,
			alternates: { languages: localeAlternates('/price') }
		})
		entries.push({
			url: localizedUrl(locale, '/blog'),
			changeFrequency: 'weekly',
			priority: 0.6,
			alternates: { languages: localeAlternates('/blog') }
		})
	}

	const slugs = new Set(routing.locales.flatMap(getAllSlugs))
	for (const slug of slugs) {
		const publishedIn = routing.locales.filter(locale =>
			getAllSlugs(locale).includes(slug)
		)
		for (const locale of publishedIn) {
			entries.push({
				url: localizedUrl(locale, `/blog/${slug}`),
				changeFrequency: 'monthly',
				priority: 0.5,
				alternates: { languages: localeAlternates(`/blog/${slug}`, publishedIn) }
			})
		}
	}

	return entries
}
