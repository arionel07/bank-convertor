import { extractPdfText } from '@/lib/pdf/extract-text'
import { findParser } from '@/lib/parsers'
import { auth } from '@/lib/auth'
import type { ParseApiResponse } from '@/lib/parsers/types'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'unauthorized' },
			{ status: 401 }
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
	const parser = findParser(text)
	if (!parser) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'unsupported_bank' },
			{ status: 422 }
		)
	}

	const transactions = parser.parse(text)
	if (transactions.length === 0) {
		return NextResponse.json<ParseApiResponse>(
			{ error: 'no_transactions' },
			{ status: 422 }
		)
	}

	return NextResponse.json<ParseApiResponse>({
		bankCode: parser.bankCode,
		bankName: parser.bankName,
		account: {},
		transactions
	})
}
