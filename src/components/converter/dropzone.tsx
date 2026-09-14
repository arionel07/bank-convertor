'use client'
import { cn } from '@/lib/utils'
import { UploadCloud } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

export function Dropzone({
	onFile,
	disabled
}: {
	onFile: (file: File) => void
	disabled?: boolean
}) {
	const t = useTranslations('converter.dropzone')
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragActive, setDragActive] = useState(false)

	function handleFiles(files: FileList | null) {
		const file = files?.[0]
		if (file) onFile(file)
	}

	return (
		<div
			role="button"
			tabIndex={0}
			aria-disabled={disabled}
			onClick={() => !disabled && inputRef.current?.click()}
			onKeyDown={e => {
				if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
					e.preventDefault()
					inputRef.current?.click()
				}
			}}
			onDragOver={e => {
				e.preventDefault()
				if (!disabled) setDragActive(true)
			}}
			onDragLeave={() => setDragActive(false)}
			onDrop={e => {
				e.preventDefault()
				setDragActive(false)
				if (!disabled) handleFiles(e.dataTransfer.files)
			}}
			className={cn(
				'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-12 sm:py-16 text-center cursor-pointer transition-colors min-h-52',
				dragActive
					? 'border-primary bg-primary/5'
					: 'border-border hover:border-primary/50 hover:bg-muted/40',
				disabled && 'pointer-events-none opacity-50'
			)}
		>
			<UploadCloud className="text-muted-foreground" size={36} />
			<div>
				<p className="font-medium">{t('title')}</p>
				<p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
			</div>
			<p className="text-xs text-muted-foreground">{t('hint')}</p>
			<input
				ref={inputRef}
				type="file"
				accept="application/pdf"
				className="sr-only"
				disabled={disabled}
				onChange={e => handleFiles(e.target.files)}
			/>
		</div>
	)
}
