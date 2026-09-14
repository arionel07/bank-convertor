'use client'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { useI18n } from '@/i18n/context'
import { TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
	error,
	reset
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const { t } = useI18n()

	useEffect(() => {
		fetch('/api/errors', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				message: error.message,
				stack: error.stack,
				url: window.location.href
			})
		}).catch(() => {})
	}, [error])

	return (
		<div className="min-h-dvh grid place-items-center bg-muted/40 p-4">
			<Card className="w-full max-w-sm shadow-xl">
				<CardHeader className="items-center text-center gap-2">
					<TriangleAlert size={32} className="text-destructive" />
					<CardTitle>{t('auth.error.generic')}</CardTitle>
					{error.digest && (
						<CardDescription className="font-mono text-xs">
							digest: {error.digest}
						</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<Button className="w-full h-11" onClick={reset}>
						{t('common.retry')}
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
