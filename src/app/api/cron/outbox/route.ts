import { processOutbox } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
	if (
		req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
	}
	await processOutbox()
	return NextResponse.json({ ok: true })
}
