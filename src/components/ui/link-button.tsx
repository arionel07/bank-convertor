import { Button } from '@/components/ui/button'
import { LinkPendingHint } from '@/components/ui/link-pending-hint'
import { Link } from '@/i18n/navigation'
import type { ComponentProps } from 'react'

// Кнопка-ссылка для Base UI: семантика <a>, стили кнопки
// Base UI не поддерживает asChild (это Radix API), вместо него render + nativeButton={false}
export function LinkButton({
	href,
	children,
	...props
}: ComponentProps<typeof Button> & { href: string }) {
	return (
		<Button nativeButton={false} render={<Link href={href} />} {...props}>
			{children}
			<LinkPendingHint />
		</Button>
	)
}
