import type { BankParser, Transaction } from './types'
import { parseAmount, toIsoDate } from './shared'

const HEADER_MARKERS = [
	/moldindconbank/i,
	/\bmicb\b/i,
	/b\.?c\.?\s*[""]?moldindconbank/i
]

/**
 * Calibrated against the real samples/moldindconbank.pdf (gitignored,
 * never committed — see /samples/README.md). Not a generic
 * parseDateLedLines (./shared.ts) client like most other parsers here,
 * because this bank's real layout has several quirks that generic
 * shape doesn't cover:
 *
 *  - only 2 trailing amount columns per row (Debit, Credit) — no
 *    per-row running balance (Sold only appears once at the top and
 *    once in the footer, not per transaction)
 *  - the empty column prints as a bare "0", not "0.00"/"0,00" — a
 *    decimal-only amount regex would simply not see it, collapsing the
 *    row to a single ambiguous token with no direction information
 *  - "Contrapartea" (counterparty) and "Denumirea operațiunii"
 *    (description) are two different table cells that pdfjs's
 *    itemsToLines flattens onto one line with no delimiter between
 *    them — split heuristically below, since counterparty names print
 *    in ALL CAPS ("SRL DACIA FRUCT", "MOLDINDCONBANK SA") and
 *    descriptions don't
 *  - both those cells can wrap onto extra lines with no leading row
 *    number/date, which must be glued back onto the previous
 *    transaction rather than read as their own (empty) row
 */
const ROW_RE =
	/^(\d{1,3})\s+(\d{2}\.\d{2}\.\d{4})\s+(\d+)\s+(.+?)\s+(0|-?[\d,]+\.\d{2})\s+(0|-?[\d,]+\.\d{2})\s*$/

// Document furniture that must never be glued onto a transaction's
// description as if it were a wrapped continuation line.
const NOISE_RE = /^(total|sold|perioada|specimen|pagina|extras|cont:|banca)/i
const HEADER_ROW_RE = /nr\s*crt/i

function isAllCapsWord(word: string): boolean {
	const letters = word.replace(/[^A-Za-zĂÂÎȚȘăâîțș]/g, '')
	if (!letters) return false
	return letters === letters.toUpperCase() && letters !== letters.toLowerCase()
}

/** Splits "MOLDINDCONBANK SA Comision deservire cont curent" into counterparty (leading ALL-CAPS run) + description (the rest). */
function splitContraparteAndDescriere(text: string): {
	counterparty: string
	description: string
} {
	const words = text.split(' ')
	let i = 0
	while (i < words.length && isAllCapsWord(words[i])) i++
	if (i === 0 || i >= words.length) {
		return { counterparty: '', description: text }
	}
	return {
		counterparty: words.slice(0, i).join(' '),
		description: words.slice(i).join(' ')
	}
}

export const moldindconbankParser: BankParser = {
	bankCode: 'moldindconbank',
	bankName: 'Moldindconbank',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		const transactions: Transaction[] = []

		for (const rawLine of text.split('\n')) {
			const line = rawLine.trim()
			if (!line) continue

			const m = line.match(ROW_RE)
			if (m) {
				const [, , dateRaw, docNumber, contraAndDescr, debitRaw, creditRaw] = m
				const date = toIsoDate(dateRaw)
				if (!date) continue

				const { counterparty, description } =
					splitContraparteAndDescriere(contraAndDescr)
				const debit = debitRaw === '0' ? 0 : Math.abs(parseAmount(debitRaw))
				const credit = creditRaw === '0' ? 0 : Math.abs(parseAmount(creditRaw))

				transactions.push({
					date,
					description,
					amount: credit - debit,
					currency: 'MDL',
					documentNumber: docNumber,
					...(counterparty ? { counterparty } : {})
				})
				continue
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
