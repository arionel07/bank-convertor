import { encode1CBytes } from '@/lib/export/onec-encoding'
import { type OneCAccountInfo, transactionsTo1C } from '@/lib/export/onec'
import type { Transaction } from '@/lib/parsers/types'
import { NextResponse } from 'next/server'

// No auth check: this is a stateless text transform over data the caller
// already holds client-side (their own edited preview table) — it makes
// no DB writes and consumes no quota, so anonymous conversions (see
// src/lib/anon-usage.ts) can export too.
export async function POST(req: Request) {
	const body = (await req.json()) as {
		transactions: Transaction[]
		account?: OneCAccountInfo
	}
	if (!Array.isArray(body.transactions)) {
		return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
	}

	const text = transactionsTo1C(body.transactions, body.account ?? {})
	const bytes = encode1CBytes(text)

	return new NextResponse(new Uint8Array(bytes), {
		headers: {
			'Content-Type': 'text/plain; charset=windows-1251',
			'Content-Disposition': 'attachment; filename="statement_1c.txt"'
		}
	})
}
