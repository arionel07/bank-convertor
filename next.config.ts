import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isDev = process.env.NODE_ENV !== 'production'

// The app has no external scripts, fonts, or images at all — next/font
// self-hosts Geist at build time, and every image/font/script served is
// same-origin — so this can be strict, EXCEPT script-src still needs
// 'unsafe-inline': Next.js bootstraps hydration via inline
// `self.__next_f.push(...)` scripts on every page, nonce-free, unless
// every route opts into per-request dynamic rendering (Next's own CSP
// guide's nonce approach) — not worth losing static optimization on
// /login and /register for. This is the exact script-src Next.js's own
// docs recommend for apps that don't need nonces. 'unsafe-eval' and the
// ws: connect-src are dev-only on top of that: Next's Fast Refresh needs
// eval() and an HMR websocket, and a production-only CSP silently
// "worked" until someone ran `next dev` and got a blocked-by-CSP blank
// page with no visible error beyond the browser console.
const CSP = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data:",
	"font-src 'self'",
	`connect-src 'self'${isDev ? ' ws://localhost:* wss://localhost:*' : ''}`,
	"frame-ancestors 'none'",
	"base-uri 'self'",
	"form-action 'self'"
].join('; ')

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: true,
	output: process.env.VERCEL ? undefined : 'standalone',
	// pdfjs-dist loads its worker script from a real on-disk path at
	// runtime (see src/lib/pdf/extract-text.ts) — keep it out of the
	// route bundle so that path still points at node_modules.
	serverExternalPackages: ['pdfjs-dist'],
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Content-Security-Policy', value: CSP },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()'
					}
				]
			}
		]
	}
}

export default withNextIntl(nextConfig)
