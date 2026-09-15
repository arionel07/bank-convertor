import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/routing'
import { getAllPostsMeta } from '@/lib/blog'
import { pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({
	params
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const [t, common] = await Promise.all([
		getTranslations({ locale, namespace: 'blog' }),
		getTranslations({ locale, namespace: 'common' })
	])
	return pageMetadata({
		locale: locale as AppLocale,
		title: t('title'),
		description: t('subtitle'),
		path: '/blog',
		siteName: common('appName')
	})
}

export default async function BlogIndexPage({
	params
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	setRequestLocale(locale as AppLocale)
	const t = await getTranslations('blog')
	const posts = getAllPostsMeta(locale as AppLocale)

	return (
		<main>
			<LandingHeader />
			<div className="px-4 py-12 sm:py-16 max-w-3xl mx-auto">
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
					{t('title')}
				</h1>
				<p className="text-muted-foreground mt-2">{t('subtitle')}</p>

				{posts.length === 0 ? (
					<p className="text-muted-foreground mt-8">{t('empty')}</p>
				) : (
					<div className="grid gap-4 mt-8">
						{posts.map(post => (
							<Link key={post.slug} href={`/blog/${post.slug}`}>
								<Card className="shadow hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle>{post.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">
											{post.description}
										</p>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
			<LandingFooter />
		</main>
	)
}
