import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// Renamed from middleware.ts to proxy.ts per Next.js 16 (middleware.js is
// deprecated); next-intl's request handler works unchanged either way.
export default createMiddleware(routing)

export const config = {
	matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
