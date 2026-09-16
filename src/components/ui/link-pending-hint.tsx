'use client'
import { useLinkStatus } from 'next/link'

/**
 * A fixed-size dot rendered inside a <Link>'s children — invisible until
 * Next.js reports that navigation is actually pending (not prefetched /
 * still loading the destination route), so a click gives some visible
 * response instead of looking like nothing happened. Must be a
 * descendant of next/link's <Link> (our i18n Link wraps it) — see
 * https://nextjs.org/docs/app/api-reference/functions/use-link-status.
 */
export function LinkPendingHint() {
	const { pending } = useLinkStatus()
	return (
		<span
			aria-hidden
			className={`inline-block size-1.5 rounded-full bg-current ml-1.5 align-middle opacity-0 transition-opacity duration-200 delay-100 ${
				pending ? 'opacity-60' : ''
			}`}
		/>
	)
}
