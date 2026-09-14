import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { routing, type AppLocale } from '@/i18n/routing'
import { SITE_URL } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Geist } from 'next/font/google'
import { notFound } from 'next/navigation'
import '../globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export function generateStaticParams() {
	return routing.locales.map(locale => ({ locale }))
}

export async function generateMetadata({
	params
}: {
	params: Promise<{ locale: string }>
}): Promise<Metadata> {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	return {
		metadataBase: new URL(SITE_URL),
		title: { default: t('appName'), template: `%s · ${t('appName')}` },
		description: t('tagline'),
		robots: { index: true, follow: true },
		openGraph: {
			type: 'website',
			siteName: t('appName'),
			title: t('appName'),
			description: t('tagline')
		},
		twitter: {
			card: 'summary_large_image',
			title: t('appName'),
			description: t('tagline')
		}
	}
}

export default async function LocaleLayout({
	children,
	params
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) notFound()

	// Renders this segment statically for the requested locale instead of
	// the one inferred at request time from cookies/headers.
	setRequestLocale(locale as AppLocale)

	return (
		<html
			lang={locale}
			className={cn(
				GeistSans.variable,
				GeistMono.variable,
				'font-sans',
				geist.variable
			)}
			suppressHydrationWarning
		>
			<body>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem={false}
				>
					<NextIntlClientProvider>
						{children}
						<Toaster position="top-center" richColors />
					</NextIntlClientProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
