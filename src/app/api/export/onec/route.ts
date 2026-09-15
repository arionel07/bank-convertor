import { auth } from '@/lib/auth'
import { encode1CBytes } from '@/lib/export/onec-encoding'
import { type OneCAccountInfo, transactionsTo1C } from '@/lib/export/onec'
import type { Transaction } from '@/lib/parsers/types'
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
	const bytes = encode1CBytes(text)

	return new NextResponse(new Uint8Array(bytes), {
		headers: {
			'Content-Type': 'text/plain; charset=windows-1251',
			'Content-Disposition': 'attachment; filename="statement_1c.txt"'
		}
	})
}
