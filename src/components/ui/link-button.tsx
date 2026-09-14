import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ComponentProps } from 'react'

// Кнопка-ссылка для Base UI: семантика <a>, стили кнопки
// Base UI не поддерживает asChild (это Radix API), вместо него render + nativeButton={false}
export function LinkButton({
	href,
	...props
}: ComponentProps<typeof Button> & { href: string }) {
	return (
		<Button nativeButton={false} render={<Link href={href} />} {...props} />
	)
}
