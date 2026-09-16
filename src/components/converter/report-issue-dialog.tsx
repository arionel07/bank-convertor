'use client'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

export function ReportIssueDialog({
	file,
	bankCode,
	trigger
}: {
	file: File | null
	bankCode: string | null
	trigger: React.ReactElement
}) {
	const t = useTranslations('converter.report')
	const [open, setOpen] = useState(false)
	const [attachedFile, setAttachedFile] = useState<File | null>(file)
	const [comment, setComment] = useState('')
	const [contactEmail, setContactEmail] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	function handleOpenChange(next: boolean) {
		setOpen(next)
		// Every time the dialog opens fresh, start from whatever's currently
		// uploaded in the converter (or nothing, if opened as a standalone
		// support contact) — a manual pick below can still override it for
		// this session.
		if (next) setAttachedFile(file)
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!attachedFile) return
		setSubmitting(true)
		try {
			const formData = new FormData()
			formData.append('file', attachedFile)
			formData.append('comment', comment)
			if (contactEmail) formData.append('contactEmail', contactEmail)
			if (bankCode) formData.append('bankCode', bankCode)

			const res = await fetch('/api/feedback', { method: 'POST', body: formData })
			if (!res.ok) throw new Error('feedback request failed')

			toast.success(t('success'))
			setOpen(false)
			setComment('')
			setContactEmail('')
		} catch {
			toast.error(t('error'))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger render={trigger} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('title')}</DialogTitle>
					<DialogDescription>{t('subtitle')}</DialogDescription>
				</DialogHeader>
				<form onSubmit={onSubmit} className="grid gap-3">
					<div className="grid gap-1.5">
						<Label>{t('fileLabel')}</Label>
						<input
							ref={fileInputRef}
							type="file"
							accept="application/pdf"
							className="hidden"
							onChange={e => setAttachedFile(e.target.files?.[0] ?? null)}
						/>
						<Button
							type="button"
							variant="outline"
							className="justify-start gap-2 font-normal"
							onClick={() => fileInputRef.current?.click()}
						>
							<Paperclip size={16} />
							{attachedFile ? attachedFile.name : t('filePlaceholder')}
						</Button>
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="report-comment">{t('commentLabel')}</Label>
						<Textarea
							id="report-comment"
							required
							minLength={3}
							placeholder={t('commentPlaceholder')}
							value={comment}
							onChange={e => setComment(e.target.value)}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="report-email">{t('emailLabel')}</Label>
						<Input
							id="report-email"
							type="email"
							placeholder={t('emailPlaceholder')}
							value={contactEmail}
							onChange={e => setContactEmail(e.target.value)}
						/>
					</div>
					<p className="text-xs text-muted-foreground">{t('privacyNote')}</p>
					<DialogFooter>
						<DialogClose render={<Button type="button" variant="outline" />}>
							{t('cancel')}
						</DialogClose>
						<Button type="submit" disabled={submitting || !attachedFile}>
							{submitting ? '…' : t('submit')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
