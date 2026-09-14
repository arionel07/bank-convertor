import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	output: process.env.VERCEL ? undefined : 'standalone',
	// pdfjs-dist loads its worker script from a real on-disk path at
	// runtime (see src/lib/pdf/extract-text.ts) — keep it out of the
	// route bundle so that path still points at node_modules.
	serverExternalPackages: ['pdfjs-dist']
}

export default withNextIntl(nextConfig)
