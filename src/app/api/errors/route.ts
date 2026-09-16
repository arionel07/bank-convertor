import { captureError } from '@/lib/capture-error'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const { message, stack, url } = await req.json().catch(() => ({}))
	if (!message) return NextResponse.json({ ok: false }, { status: 400 })
	const err = new Error(String(message).slice(0, 500))
	// The client's own stack trace is the whole point of this route (a
	// fresh Error() constructed here only ever points at this line) —
	// override it with what the client actually sent, when present.
	if (stack) err.stack = String(stack).slice(0, 4000)
	await captureError(err, {
		source: 'client',
		url: url ? String(url).slice(0, 500) : undefined
	})
	return NextResponse.json({ ok: true })
}
