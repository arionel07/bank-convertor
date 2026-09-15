import type { AppLocale } from '@/i18n/routing'
import { getPostMeta } from '@/lib/blog'
import { getTranslations } from 'next-intl/server'
import { ImageResponse } from 'next/og'

// Not 'edge': getPostMeta() reads the .mdx file from disk (fs/path aren't
// available in the Edge runtime).
export const alt = 'bank-converter'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
	params
}: {
	params: Promise<{ locale: string; slug: string }>
}) {
	const { locale, slug } = await params
	const meta = getPostMeta(locale as AppLocale, slug)
	const t = await getTranslations({ locale, namespace: 'common' })

	return new ImageResponse(
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				padding: 80,
				background: '#0a0a0a',
				color: 'white'
			}}
		>
			<div style={{ fontSize: 32, opacity: 0.7 }}>{t('appName')}</div>
			<div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.2 }}>
				{meta?.title ?? t('appName')}
			</div>
		</div>,
		{ ...size }
	)
}
