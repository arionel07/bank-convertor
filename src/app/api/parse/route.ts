import {
	hasUsedAnonymousConversion,
	markAnonymousConversionUsed
} from '@/lib/anon-usage'
import { auth } from '@/lib/auth'
import { findParserWithFallback } from '@/lib/parsers'
import type { ParseApiResponse } from '@/lib/parsers/types'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { canConvert, recordUsage } from '@/lib/usage'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

export async function POST(req: Request) {
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
		account: {},
		transactions,
		...(isFallback ? { warning: 'generic_fallback' as const } : {})
	})
}
