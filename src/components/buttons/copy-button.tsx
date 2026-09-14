'use client'
import { Check, Copy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
export function CopyButton({ value }: { value: string }) {
	const t = useTranslations('common')
	const [copied, setCopied] = useState(false)

	async function copy() {
		await navigator.clipboard.writeText(value)
		setCopied(true)
		setTimeout(() => setCopied(false), 1500)
	}

	return (
		<button
			type="button"
			className="btn btn-ghost btn-sm min-h-10 gap-2"
			onClick={copy}
		>
			{copied ? (
				<Check size={16} className="text-success" />
			) : (
				<Copy size={16} />
			)}
			{copied ? t('copied') : t('copy')}
		</button>
	)
}
