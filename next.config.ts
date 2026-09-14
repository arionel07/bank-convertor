import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	output: process.env.VERCEL ? undefined : 'standalone'
}

export default withNextIntl(nextConfig)
