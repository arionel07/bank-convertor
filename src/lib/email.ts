import { emailOutbox } from '@/db/schema'
import { ParserFeedbackEmail } from '@/emails/parser-feedback'
import { WelcomeEmail } from '@/emails/welcome'
import { captureError } from '@/lib/capture-error'
import { db } from '@/lib/db'
import { render } from '@react-email/render'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'

// Ленивая инициализация: не падаем при импорте модуля, если ключ не задан
function getResend() {
	if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
	return new Resend(process.env.RESEND_API_KEY)
}

const TEMPLATES = {
	welcome: {
		subject: 'Добро пожаловать',
		render: (p: { name: string }) => render(WelcomeEmail(p))
	},
	parserFeedback: {
		subject: 'Файл не распознался — новый отзыв',
		render: (p: {
			bankCode: string | null
			comment: string
			contactEmail: string | null
			fileName: string
			downloadUrl: string
			expiresInHours: number
		}) => render(ParserFeedbackEmail(p))
	}
} as const

export async function enqueueEmail(
	to: string,
	template: keyof typeof TEMPLATES,
	payload: Record<string, unknown>
) {
	await db
		.insert(emailOutbox)
		.values({ to, template, payload, subject: TEMPLATES[template].subject })
}

export async function processOutbox(limit = 10) {
	const resend = getResend() // ← здесь создаём клиент, не на верхнем уровне
	const pending = await db
		.select()
		.from(emailOutbox)
		.where(eq(emailOutbox.status, 'pending'))
		.limit(limit)

	for (const job of pending) {
		try {
			const html = await TEMPLATES[
				job.template as keyof typeof TEMPLATES
			].render(job.payload as never)
			await resend.emails.send({
				from: process.env.EMAIL_FROM!,
				to: job.to,
				subject: job.subject,
				html
			})
			await db
				.update(emailOutbox)
				.set({ status: 'sent', sentAt: new Date() })
				.where(eq(emailOutbox.id, job.id))
		} catch (e) {
			await captureError(e, { source: 'cron', url: '/api/cron/outbox' })
			const attempts = job.attempts + 1
			await db
				.update(emailOutbox)
				.set({ status: attempts >= 3 ? 'failed' : 'pending', attempts })
				.where(eq(emailOutbox.id, job.id))
		}
	}
}
