import { NextResponse } from 'next/server'

const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

export async function POST(req: Request) {
	const formData = await req.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) {
		return NextResponse.json({ error: 'no_file' }, { status: 400 })
	}
	if (file.type !== 'application/pdf') {
		return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
	}
	if (file.size > MAX_SIZE) {
		return NextResponse.json({ error: 'too_large' }, { status: 400 })
	}

	// TODO(task 3): extract text with pdfjs-dist and run it through the
	// src/lib/parsers registry (BankParser.match / .parse).
	return NextResponse.json({ error: 'not_implemented' }, { status: 501 })
}
