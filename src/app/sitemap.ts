import { SITE_URL } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{ url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
		{ url: `${SITE_URL}/price`, changeFrequency: 'monthly', priority: 0.8 }
	]
}
