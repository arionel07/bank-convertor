import { parserFeedback } from '@/db/schema'
import { db } from '@/lib/db'
import { FEEDBACK_RETENTION_HOURS } from '@/lib/feedback'
import { lt } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
	if (
		req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
	}

	const cutoff = new Date(Date.now() - FEEDBACK_RETENTION_HOURS * 60 * 60 * 1000)
	const deleted = await db
		.delete(parserFeedback)
		.where(lt(parserFeedback.createdAt, cutoff))
		.returning({ id: parserFeedback.id })

	return NextResponse.json({ ok: true, deleted: deleted.length })
}
