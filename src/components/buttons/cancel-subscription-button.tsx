'use client'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export function CancelSubscriptionButton() {
	const t = useTranslations()
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function cancel() {
		if (!window.confirm(t('billing.cancelConfirm'))) return
		setError(null)
		setLoading(true)
		const res = await fetch('/api/billing/cancel', { method: 'POST' })
		setLoading(false)
		if (res.ok) router.refresh()
		else setError(t('auth.error.generic'))
	}

	return (
		<div className="grid gap-2">
			<Button
				variant="destructive"
				className="w-full h-11"
				disabled={loading}
				onClick={cancel}
			>
				{loading ? '…' : t('billing.cancel')}
			</Button>
			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
		</div>
	)
}
