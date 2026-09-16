import { parserFeedback } from '@/db/schema'
import { auth } from '@/lib/auth'
import { captureError } from '@/lib/capture-error'
import { db } from '@/lib/db'
import { enqueueEmail } from '@/lib/email'
import { FEEDBACK_MAX_COMMENT_LENGTH, FEEDBACK_RETENTION_HOURS } from '@/lib/feedback'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { SITE_URL } from '@/lib/seo'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB — same cap as /api/parse

// This is open to anonymous visitors with no usage check (see the doc
// comment below), which is exactly what makes it spam-prone — a tight
// cap since a real user reports a handful of bad files at most, not
// dozens per minute.
const RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 }

// Lets a user hand us the exact PDF their converter run failed or
// misread, for manual parser calibration — see the comment on
// parserFeedback in src/db/schema.ts. Open to anonymous visitors too
// (no usage/quota check): reporting a bad parse costs them nothing and
// isn't a conversion.
export async function POST(req: Request) {
	const rateLimit = checkRateLimit(
		`feedback:${getClientIp(req)}`,
		RATE_LIMIT.limit,
		RATE_LIMIT.windowMs
	)
	if (!rateLimit.allowed) {
		return NextResponse.json(
			{ error: 'rate_limited' },
			{
				status: 429,
				headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) }
			}
		)
	}

	const session = await auth.api.getSession({ headers: await headers() })

	const formData = await req.formData().catch(() => null)
	if (!formData) {
		return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
	}

	const file = formData.get('file')
	const comment = formData.get('comment')
	const contactEmail = formData.get('contactEmail')
	const bankCode = formData.get('bankCode')

	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'no_file' }, { status: 400 })
	}
	if (file.type !== 'application/pdf') {
		return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
	}
	if (file.size > MAX_SIZE) {
		return NextResponse.json({ error: 'too_large' }, { status: 400 })
	}
	if (typeof comment !== 'string' || comment.trim().length === 0) {
		return NextResponse.json({ error: 'no_comment' }, { status: 400 })
	}

	const fileBase64 = Buffer.from(await file.arrayBuffer()).toString('base64')
	const downloadToken = crypto.randomUUID()

	const [row] = await db
		.insert(parserFeedback)
		.values({
			userId: session?.user.id,
			bankCode: typeof bankCode === 'string' && bankCode ? bankCode : null,
			comment: comment.trim().slice(0, FEEDBACK_MAX_COMMENT_LENGTH),
			contactEmail:
				typeof contactEmail === 'string' && contactEmail ? contactEmail : null,
			fileName: file.name.slice(0, 255),
			fileBase64,
			downloadToken
		})
		.returning({ id: parserFeedback.id })

	// Notification is best-effort: the report is already saved above, so a
	// failure here (e.g. FEEDBACK_NOTIFY_EMAIL unset) must not fail the
	// request — it's captured instead so it's visible in /dashboard-adjacent
	// error tracking rather than silently missed forever.
	try {
		if (!process.env.FEEDBACK_NOTIFY_EMAIL) {
			throw new Error('FEEDBACK_NOTIFY_EMAIL is not set')
		}
		await enqueueEmail(process.env.FEEDBACK_NOTIFY_EMAIL, 'parserFeedback', {
			bankCode: typeof bankCode === 'string' && bankCode ? bankCode : null,
			comment: comment.trim().slice(0, FEEDBACK_MAX_COMMENT_LENGTH),
			contactEmail:
				typeof contactEmail === 'string' && contactEmail ? contactEmail : null,
			fileName: file.name.slice(0, 255),
			downloadUrl: `${SITE_URL}/api/feedback/${row.id}/download?token=${downloadToken}`,
			expiresInHours: FEEDBACK_RETENTION_HOURS
		})
	} catch (e) {
		await captureError(e, { source: 'server', url: '/api/feedback' })
	}

	return NextResponse.json({ ok: true })
}
