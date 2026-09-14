import type { Metadata } from 'next'

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'

// Next.js НЕ мёржит вложенные openGraph/twitter между родителем и страницей —
// export const metadata на странице полностью ЗАМЕНЯЕТ объект родителя. Поэтому
// каждая страница должна явно указывать полный набор полей (type, siteName,
// card и т.д.), а не только title/description — этот хелпер задаёт их
// одинаково для всех страниц и защищает от повторения той же ошибки.
export function pageMetadata({
	title,
	description,
	path,
	robots
}: {
	title: string
	description: string
	path: string
	robots?: Metadata['robots']
}): Metadata {
	return {
		// absolute: каждая страница уже сама включает «Slyshno» в title —
		// без этого сработал бы ещё и шаблон '%s · Slyshno' из корневого
		// layout, и бренд задвоился бы («Pricing — Slyshno · Slyshno»).
		title: { absolute: title },
		description,
		alternates: { canonical: path },
		...(robots ? { robots } : {}),
		openGraph: {
			type: 'website',
			siteName: 'app-name',
			title,
			description,
			url: path
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

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: 'app-name', path: '' }, ...trail].map(
			(item, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: item.name,
				item: `${SITE_URL}${item.path}`
			})
		)
	}
}
