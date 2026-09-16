import type { BankParser, Transaction } from './types'
import { parseAmount } from './shared'

const HEADER_MARKERS = [
	// real header prints as "MOLDOVA-AGROINDBANK" — a hyphen, not a space
	/moldova[\s-]*agroindbank/i,
	/\bmaib\b/i,
	/b\.?c\.?\s*[""]?moldova[\s-]*agroindbank/i
]

// A transaction row starts with Nr, then dd/mm/yyyy (this bank uses
// slashes, not dots), then everything else (doc number, counterparty,
// tax code, description, debit, credit) — extracted piecemeal below,
// not in one regex, because of the real-file quirks documented there.
const ROW_START_RE = /^(\d{1,3})\s+(\d{2})[./-](\d{2})[./-](\d{2,4})/
const DOC_NUMBER_RE = /^\s*(\d+)(?:\s*\(R\))?\s*/
const TAIL_RE =
	/^(.+?)\s*(\d{10,13})\s*(.+?)\s+(0|-?[\d,]+\.\d{2})\s+(0|-?[\d,]+\.\d{2})\s*$/

const HEADER_ROW_RE = /nr\s*data/i
const NOISE_RE =
	/^(total|specimen|pagina|extras\s*de\s*cont|conturi|num[aă]r\s*cont|perioada|sold|moldova-agroindbank)/i

function toIsoDateSlash(dd: string, mm: string, yy: string): string {
	const year = yy.length === 2 ? `20${yy}` : yy
	return `${year}-${mm}-${dd}`
}

/**
 * Calibrated against the real samples/maib-operational.pdf (gitignored
 * upstream, committed here as src/lib/parsers/fixtures/maib-operational.pdf
 * since it's explicitly marked "SPECIMEN — date fictive" — fictional test
 * data, not a real customer statement). Real quirks a generic
 * parseDateLedLines (./shared.ts) row can't handle, which is why this
 * parser builds each row up in stages instead:
 *
 *  - dates use slashes (dd/mm/yyyy), not dots
 *  - the row number, doc number, counterparty, tax code ("Cod fiscal")
 *    and description are 5 different table cells that pdfjs's
 *    itemsToLines flattens onto one line with no delimiters between
 *    them; the tax code (always 10-13 digits) is the only one of those
 *    with a fixed, unambiguous shape, so it's used as the anchor to
 *    split counterparty (before it) from description (after it)
 *  - on 2 of 15 real rows the date, doc number, and counterparty are
 *    rendered with NO space between them at all ("07/09/20268788608001BC
 *    Moldova-Agroindbank...") — a pdfjs artifact from that PDF's layout,
 *    not a formatting choice — so date/doc-number extraction below
 *    can't rely on whitespace as a separator, only on digit-run length
 *  - some doc numbers carry a " (R)" suffix
 *  - the counterparty/description cells can wrap onto extra lines with
 *    no leading row number/date, which get glued onto the previous
 *    transaction's description (not split back into counterparty vs.
 *    description — pdfjs's flattening loses which cell a continuation
 *    line belongs to, so the counterparty field may end up missing a
 *    branch/address suffix that continues on the next line; this is a
 *    known, accepted imprecision, not a sign or total error)
 *  - the table header repeats on every page and must never be read as
 *    a transaction or glued on as a continuation
 */
export const maibParser: BankParser = {
	bankCode: 'maib',
	bankName: 'Moldova Agroindbank (maib)',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		const transactions: Transaction[] = []

		for (const rawLine of text.split('\n')) {
			const line = rawLine.trim()
			if (!line) continue

			const start = line.match(ROW_START_RE)
			if (start) {
				const [, , dd, mm, yy] = start
				const rest = line.slice(start[0].length)
				const docMatch = rest.match(DOC_NUMBER_RE)
				const afterDoc = docMatch ? rest.slice(docMatch[0].length) : rest.trim()
				const tail = afterDoc.match(TAIL_RE)

				if (docMatch && tail) {
					const [, counterparty, , description, debitRaw, creditRaw] = tail
					const debit = debitRaw === '0' ? 0 : Math.abs(parseAmount(debitRaw))
					const credit = creditRaw === '0' ? 0 : Math.abs(parseAmount(creditRaw))

					transactions.push({
						date: toIsoDateSlash(dd, mm, yy),
						description: description.trim(),
						amount: credit - debit,
						currency: 'MDL',
						documentNumber: docMatch[1],
						...(counterparty.trim() ? { counterparty: counterparty.trim() } : {})
					})
					continue
				}
			}

			// Not a transaction row: either document furniture (header,
			// footer, period/balance metadata) or a wrapped continuation of
			// the previous row's counterparty/description text.
			if (transactions.length === 0) continue
			if (HEADER_ROW_RE.test(line) || NOISE_RE.test(line)) continue
			transactions[transactions.length - 1].description += ` ${line}`
		}

		return transactions
	}
}
