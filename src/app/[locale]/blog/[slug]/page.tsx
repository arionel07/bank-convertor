import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { mdxComponents } from '@/components/blog/mdx-components'
import { Link } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { getAllSlugs, getPostMeta, getPostSource } from '@/lib/blog'
import { pageMetadata } from '@/lib/seo'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { compileMDX } from 'next-mdx-remote/rsc'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
	return routing.locales.flatMap(locale =>
		getAllSlugs(locale).map(slug => ({ locale, slug }))
	)
}

export async function generateMetadata({
	params
}: {
	params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
	const { locale, slug } = await params
	const meta = getPostMeta(locale as AppLocale, slug)
	if (!meta) return {}
	return pageMetadata({
		title: meta.title,
		description: meta.description,
		path: `/blog/${slug}`
	})
}

export default async function BlogPostPage({
	params
}: {
	params: Promise<{ locale: string; slug: string }>
}) {
	const { locale, slug } = await params
	setRequestLocale(locale as AppLocale)
	const t = await getTranslations('blog')

	const source = getPostSource(locale as AppLocale, slug)
	const meta = getPostMeta(locale as AppLocale, slug)
	if (!source || !meta) notFound()

	const { content } = await compileMDX({
		source,
		components: mdxComponents,
		options: { parseFrontmatter: true }
	})

	return (
		<main>
			<LandingHeader />
			<article className="px-4 py-12 sm:py-16 max-w-2xl mx-auto">
				<Link
					href="/blog"
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
				>
					<ChevronLeft size={16} />
					{t('backToBlog')}
				</Link>
				<time
					dateTime={meta.date}
					className="text-sm text-muted-foreground block mb-2"
				>
					{new Date(meta.date).toLocaleDateString(locale)}
				</time>
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
					{meta.title}
				</h1>
				{content}
			</article>
			<LandingFooter />
		</main>
	)
}
