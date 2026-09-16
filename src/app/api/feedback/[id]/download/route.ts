import { parserFeedback } from '@/db/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Deliberately unauthenticated (there's no admin-role system in this
// project — see src/db/auth-schema.ts): the random per-row downloadToken,
// only ever sent to FEEDBACK_NOTIFY_EMAIL, is the access control. Once
// the row is purged by /api/cron/purge-feedback the token stops working
// on its own, so this needs no separate expiry check.
export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params
	const token = new URL(req.url).searchParams.get('token')
	if (!token) {
		return NextResponse.json({ error: 'missing_token' }, { status: 400 })
	}

	const [row] = await db
		.select()
		.from(parserFeedback)
		.where(eq(parserFeedback.id, id))

	if (!row || row.downloadToken !== token) {
		return NextResponse.json({ error: 'not_found' }, { status: 404 })
	}

	return new NextResponse(Buffer.from(row.fileBase64, 'base64'), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${row.fileName.replace(/"/g, '')}"`
		}
	})
}
