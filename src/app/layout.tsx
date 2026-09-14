import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/i18n/context'
import { getDictionary } from '@/i18n/server'
import { cn } from '@/lib/utils'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'
const SITE_DESCRIPTION =
	'Public feedback board, embeddable widget, roadmap, and changelog with automatic email updates — collect feedback, prioritize it, and close the loop with your users.'

// Метаданные по умолчанию для всего сайта; страницы переопределяют
// title/description/alternates своим export const metadata.
export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: { default: 'app', template: '%s · app' },
	description: SITE_DESCRIPTION,
	robots: { index: true, follow: true },
	openGraph: {
		type: 'website',
		siteName: 'app',
		title: 'app',
		description: SITE_DESCRIPTION
	},
	twitter: {
		card: 'summary_large_image',
		title: 'app',
		description: SITE_DESCRIPTION
	}
}
// export const metadata: Metadata = {
// 	metadataBase: new URL(SITE_URL),
// 	title: {
// 		default: 'app ',
// 		template: '%s · app'
// 	},
// 	description: SITE_DESCRIPTION,
// 	applicationName: '',
// 	robots: { index: true, follow: true },
// 	openGraph: {
// 		type: 'website',
// 		siteName: 'app',
// 		title: 'app — ',
// 		description: SITE_DESCRIPTION
// 	},
// 	twitter: {
// 		card: 'summary_large_image',
// 		title: 'app —',
// 		description: SITE_DESCRIPTION
// 	}
// }

export default async function RootLayout({
	children
}: {
	children: React.ReactNode
}) {
	const { locale, dict } = await getDictionary()

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
					<I18nProvider locale={locale} dict={dict}>
						{children}
						<Toaster position="top-center" richColors />
					</I18nProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
