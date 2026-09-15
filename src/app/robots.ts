import { SITE_URL } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			// converter is public now (works without an account) and is the
			// product's main SEO target — only dashboard (account/billing)
			// stays out, it's already `noindex` via metadata too.
			disallow: ['/api/', '/*/dashboard']
		},
		sitemap: `${SITE_URL}/sitemap.xml`
	}
}
