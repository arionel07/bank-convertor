import { auth } from '@/lib/auth'
import { type OneCAccountInfo, transactionsTo1C } from '@/lib/export/onec'
import type { Transaction } from '@/lib/parsers/types'
import iconv from 'iconv-lite'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session) {
		return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
	}

	const body = (await req.json()) as {
		transactions: Transaction[]
		account?: OneCAccountInfo
	}
	if (!Array.isArray(body.transactions)) {
		return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
	}

	const text = transactionsTo1C(body.transactions, body.account ?? {})
	// 1CClientBankExchange files are single-byte windows-1251 — no BOM: the
	// file's first bytes must be the literal "1CClientBankExchange" ASCII
	// signature, which a UTF byte-order mark would corrupt.
	const bytes = new Uint8Array(iconv.encode(text, 'win1251'))

	return new NextResponse(bytes, {
		headers: {
			'Content-Type': 'text/plain; charset=windows-1251',
			'Content-Disposition': 'attachment; filename="statement_1c.txt"'
		}
	})
}
