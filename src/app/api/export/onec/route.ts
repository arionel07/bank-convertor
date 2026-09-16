import { type OneCAccountInfo, type OneCEncoding, transactionsTo1C } from '@/lib/export/onec'
import { encode1CBytes } from '@/lib/export/onec-encoding'
import { transliterate } from '@/lib/export/transliterate'
import type { Transaction } from '@/lib/parsers/types'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

// Cheap (no DB, no file parsing), but still a network round-trip with no
// quota check at all (see the no-auth-check note below) — a looser cap
// than /api/parse, just to put some ceiling on it.
const RATE_LIMIT = { limit: 30, windowMs: 60_000 }

// No auth check: this is a stateless text transform over data the caller
// already holds client-side (their own edited preview table) — it makes
// no DB writes and consumes no quota, so anonymous conversions (see
// src/lib/anon-usage.ts) can export too.
export async function POST(req: Request) {
	const rateLimit = checkRateLimit(
		`onec:${getClientIp(req)}`,
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

	const body = (await req.json()) as {
		transactions: Transaction[]
		account?: OneCAccountInfo
		encoding?: OneCEncoding
	}
	if (!Array.isArray(body.transactions)) {
		return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
	}

	const encoding: OneCEncoding = body.encoding ?? 'win1251'
	// 'translit' additionally transliterates Cyrillic data values to ASCII
	// (protocol keys are never touched either way) before the file is
	// encoded as win1251 — the only wire encoding, see encode1CBytes,
	// which on its own already auto-transliterates Romanian diacritics
	// regardless of this mode, since win1251 can't represent those at all.
	const text = transactionsTo1C(
		body.transactions,
		body.account ?? {},
		encoding === 'translit' ? transliterate : undefined
	)
	const bytes = encode1CBytes(text)

	return new NextResponse(new Uint8Array(bytes), {
		headers: {
			'Content-Type': 'text/plain; charset=windows-1251',
			'Content-Disposition': 'attachment; filename="statement_1c.txt"'
		}
	})
}
