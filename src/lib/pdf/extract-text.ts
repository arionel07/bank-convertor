import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

// pdfjs-dist always needs a worker script, even for text extraction in
// Node — point it at the bundled worker on disk instead of a URL, since
// there is no browser to fetch one from. `serverExternalPackages` in
// next.config.ts keeps pdfjs-dist out of the route bundle so this path
// still resolves against the real node_modules folder at runtime.
if (!GlobalWorkerOptions.workerSrc) {
	GlobalWorkerOptions.workerSrc = pathToFileURL(
		path.join(
			process.cwd(),
			'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
		)
	).href
}

type TextItem = { str: string; transform: number[] }

const LINE_Y_TOLERANCE = 2.5

/**
 * pdfjs only reports each glyph run's position — it doesn't reconstruct
 * lines. Bank statements are tabular, so we cluster items by y (row) and
 * sort each row by x (column) to get back readable, space-separated lines
 * that a BankParser can run regexes against.
 */
function itemsToLines(items: TextItem[]): string[] {
	const withText = items.filter(
		(item): item is TextItem => 'str' in item && item.str.trim().length > 0
	)
	const sorted = [...withText].sort((a, b) => b.transform[5] - a.transform[5])

	const rows: { y: number; items: TextItem[] }[] = []
	for (const item of sorted) {
		const y = item.transform[5]
		const row = rows.find(r => Math.abs(r.y - y) <= LINE_Y_TOLERANCE)
		if (row) row.items.push(item)
		else rows.push({ y, items: [item] })
	}

	return rows.map(row =>
		row.items
			.sort((a, b) => a.transform[4] - b.transform[4])
			.map(i => i.str)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim()
	)
}

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
	const loadingTask = getDocument({
		data: new Uint8Array(data),
		useSystemFonts: true
	})

	try {
		const doc = await loadingTask.promise
		const pages: string[] = []
		for (let i = 1; i <= doc.numPages; i++) {
			const page = await doc.getPage(i)
			const content = await page.getTextContent()
			pages.push(itemsToLines(content.items as TextItem[]).join('\n'))
			page.cleanup()
		}
		return pages.join('\n')
	} finally {
		await loadingTask.destroy()
	}
}
