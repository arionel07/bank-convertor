import { captureError } from '@/lib/capture-error'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const { message, stack, url } = await req.json().catch(() => ({}))
	if (!message) return NextResponse.json({ ok: false }, { status: 400 })
	await captureError(new Error(String(message).slice(0, 500)), {
		source: 'client',
		url: url ? String(url).slice(0, 500) : undefined
	})
	return NextResponse.json({ ok: true })
}
