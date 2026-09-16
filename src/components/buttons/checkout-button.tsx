'use client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useState } from 'react'

/**
 * Plain <a> to a route handler (/api/billing/checkout), which itself
 * redirects to Lemon Squeezy — not a same-app <Link>, so there's no
 * router-level pending state to hook into. Setting local state on click
 * and letting the anchor's default navigation proceed still shows the
 * spinner for the moment before the browser actually leaves the page.
 */
export function CheckoutButton({
	href,
	children
}: {
	href: string
	children: React.ReactNode
}) {
	const [loading, setLoading] = useState(false)
	return (
		<Button
			nativeButton={false}
			render={<a href={href} />}
			className="w-full h-11"
			aria-disabled={loading}
			onClick={() => setLoading(true)}
		>
			{loading ? <Spinner /> : children}
		</Button>
	)
}
