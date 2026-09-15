import type { AppLocale } from '@/i18n/routing'
import matter from 'gray-matter'
import fs from 'node:fs'
import path from 'node:path'

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog')

export type BlogFrontmatter = {
	title: string
	description: string
	date: string
}

export type BlogPostMeta = BlogFrontmatter & {
	slug: string
	locale: AppLocale
}

function postFile(locale: AppLocale, slug: string): string {
	return path.join(CONTENT_DIR, locale, `${slug}.mdx`)
}

export function getAllSlugs(locale: AppLocale): string[] {
	const dir = path.join(CONTENT_DIR, locale)
	if (!fs.existsSync(dir)) return []
	return fs
		.readdirSync(dir)
		.filter(file => file.endsWith('.mdx'))
		.map(file => file.replace(/\.mdx$/, ''))
}

export function getPostSource(locale: AppLocale, slug: string): string | null {
	const file = postFile(locale, slug)
	return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
}

export function getPostMeta(
	locale: AppLocale,
	slug: string
): BlogPostMeta | null {
	const source = getPostSource(locale, slug)
	if (!source) return null
	const { data } = matter(source)
	return {
		slug,
		locale,
		title: data.title,
		description: data.description,
		date: data.date
	}
}

export function getAllPostsMeta(locale: AppLocale): BlogPostMeta[] {
	return getAllSlugs(locale)
		.map(slug => getPostMeta(locale, slug))
		.filter((post): post is BlogPostMeta => post !== null)
		.sort((a, b) => (a.date < b.date ? 1 : -1))
}
