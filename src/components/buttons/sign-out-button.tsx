'use client'
import { useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { ROUTES } from '@/lib/routes'
import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function SignOutButton() {
	const t = useTranslations()
	const router = useRouter()
	return (
		<button
			className="btn btn-ghost btn-sm min-h-10"
			onClick={async () => {
				await authClient.signOut()
				router.push(ROUTES.login)
			}}
		>
			<LogOut size={16} />
			<span className="hidden sm:inline">{t('nav.signOut')}</span>
		</button>
	)
}
