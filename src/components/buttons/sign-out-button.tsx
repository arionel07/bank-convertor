'use client'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { ROUTES } from '@/lib/routes'
import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ComponentProps } from 'react'

/**
 * `compact`: hide the label below the `sm` breakpoint (for a tight navbar,
 * icon-only on mobile) vs. always showing it (e.g. inside a full-width
 * mobile sheet, where there's room and the icon alone reads as unclear).
 */
export function SignOutButton({
	compact = true,
	variant = 'ghost',
	size = 'sm',
	className,
	...props
}: { compact?: boolean } & Partial<ComponentProps<typeof Button>>) {
	const t = useTranslations()
	const router = useRouter()
	return (
		<Button
			variant={variant}
			size={size}
			className={className ?? 'h-10 gap-1.5'}
			onClick={async () => {
				await authClient.signOut()
				router.push(ROUTES.login)
			}}
			{...props}
		>
			<LogOut size={16} />
			<span className={compact ? 'hidden sm:inline' : ''}>
				{t('nav.signOut')}
			</span>
		</Button>
	)
}
