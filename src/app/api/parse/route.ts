import {
	hasUsedAnonymousConversion,
	markAnonymousConversionUsed
} from '@/lib/anon-usage'
import { auth } from '@/lib/auth'
import { extractAccount } from '@/lib/parsers/account-header'
import { findParserWithFallback } from '@/lib/parsers'
import type { ParseApiResponse } from '@/lib/parsers/types'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { canConvert, recordUsage } from '@/lib/usage'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

// PDF parsing is CPU-heavy (pdfjs) — this caps rapid-fire retries/abuse
// on top of the monthly usage limit above, which only counts *successful*
// conversions and does nothing to stop a burst of requests before that
// limit is hit. Same-IP visitors share a bucket, so a shared office/NAT
// IP can legitimately bump into this under heavy use — that's an
// accepted trade-off of IP-based limiting without an account system for
// anonymous requests.
const RATE_LIMIT = { limit: 10, windowMs: 60_000 }

export async function POST(req: Request) {
	const rateLimit = checkRateLimit(
		`parse:${getClientIp(req)}`,
		RATE_LIMIT.limit,
		RATE_LIMIT.windowMs
	)
	if (!rateLimit.allowed) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'rate_limited' },
			{
				status: 429,
				headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) }
			}
		)
	}

	const session = await auth.api.getSession({ headers: await headers() })

	// No file is ever stored server-side either way — extraction happens
	// entirely in memory for the duration of this request.
	if (session) {
		if (!(await canConvert(session.user.id))) {
			return NextResponse.json<ParseApiResponse>(
				{ error: 'limit_reached' },
				{ status: 402 }
			)
		}
	} else if (await hasUsedAnonymousConversion()) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'anon_limit_reached' },
			{ status: 402 }
		)
	}

	const formData = await req.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'no_file' },
			{ status: 400 }
		)
	}
	if (file.type !== 'application/pdf') {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'invalid_type' },
			{ status: 400 }
		)
	}
	if (file.size > MAX_SIZE) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'too_large' },
			{ status: 400 }
		)
	}

	const text = await extractPdfText(await file.arrayBuffer())
	const { parser, isFallback } = findParserWithFallback(text)

	const transactions = parser.parse(text)
	if (transactions.length === 0) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'no_transactions' },
			{ status: 422 }
		)
	}

	if (session) {
		await recordUsage(session.user.id, parser.bankCode)
	} else {
		await markAnonymousConversionUsed()
	}

	return NextResponse.json<ParseApiResponse>({
		bankCode: parser.bankCode,
		bankName: parser.bankName,
		account: extractAccount(text),
		transactions,
		...(isFallback ? { warning: 'generic_fallback' as const } : {})
	})
}
