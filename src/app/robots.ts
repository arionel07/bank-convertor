import { SITE_URL } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			// converter/dashboard are already `noindex` via metadata (see
			// (app)/layout.tsx) — kept out of crawl too, across every locale.
			disallow: ['/api/', '/*/converter', '/*/dashboard']
		},
		sitemap: `${SITE_URL}/sitemap.xml`
	}
}
