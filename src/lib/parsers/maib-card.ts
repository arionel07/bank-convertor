import type { BankParser, Transaction } from './types'

// Must be more specific than maib.ts's generic MAIB markers — this parser
// has to win the match() race (see ./index.ts's PARSERS order) only for
// the card-account statement layout, never the operational-account one.
const HEADER_MARKERS = [/conturi\s*de\s*card/i, /denumirea\s*contra\s*p[aă]r[țt]ii/i]

const ROW_START_RE = /^(\d{2})[./-](\d{2})[./-](\d{2,4})\s+(\d+)\s*/
const AMOUNT_RE = /-?[\d,]+\.\d{2}/g

const HEADER_ROW_RE = /data\s*tranzac/i
const NOISE_RE =
	/^(maib\s*s\.a\.|extras\s*de\s*cont|conturi\s*de\s*card|numar\s*cont|sold|valuta|perioada|specimen|pagina)/i

function toIsoDateSlash(dd: string, mm: string, yy: string): string {
	const year = yy.length === 2 ? `20${yy}` : yy
	return `${year}-${mm}-${dd}`
}

/**
 * Calibrated against the real samples/maib-card.pdf (gitignored upstream,
 * committed here as src/lib/parsers/fixtures/maib-card.pdf — marked
 * "SPECIMEN — date fictive", fictional test data). A card-account
 * statement from the same bank as maib.ts, but with a genuinely
 * different table shape, hence its own parser rather than a variant of
 * maib.ts's:
 *
 *  - the description narrative can itself contain a "-<amount> lei"
 *    phrase describing an internal sub-account transfer (e.g. "din 803
 *    în 802 -2292.07 lei") — that is NOT the real Debit/Credit for the
 *    row, just descriptive text, so this can't take "the first
 *    negative-looking number" as the amount; instead it takes the LAST
 *    TWO decimal-shaped numbers on the line, since Debit/Credit are
 *    always the rightmost two columns
 *  - "Denumirea Contra Părții" (counterparty) is the LAST column,
 *    printed with zero gap right after the Credit value
 *    ("2,292.07GRITIUC VIORICA") — taken as whatever text follows the
 *    last matched amount
 *  - descriptions can wrap onto extra lines with no leading date, which
 *    get glued onto the previous transaction's description (see
 *    maib.ts's doc comment for why continuations aren't split back into
 *    counterparty vs. description — same reasoning applies here)
 */
export const maibCardParser: BankParser = {
	bankCode: 'maib-card',
	bankName: 'Moldova Agroindbank (maib) — card',

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
				const [, dd, mm, yy, tranzNumber] = start
				const rest = line.slice(start[0].length)
				const amounts = [...rest.matchAll(AMOUNT_RE)]

				if (amounts.length >= 2) {
					const debitMatch = amounts[amounts.length - 2]
					const creditMatch = amounts[amounts.length - 1]
					const description = rest.slice(0, debitMatch.index).trim()
					const counterparty = rest
						.slice(creditMatch.index + creditMatch[0].length)
						.trim()
					const debit = Math.abs(Number.parseFloat(debitMatch[0].replace(/,/g, '')))
					const credit = Math.abs(Number.parseFloat(creditMatch[0].replace(/,/g, '')))

					transactions.push({
						date: toIsoDateSlash(dd, mm, yy),
						description,
						amount: credit - debit,
						currency: 'MDL',
						documentNumber: tranzNumber,
						...(counterparty ? { counterparty } : {})
					})
					continue
				}
			}

			if (transactions.length === 0) continue
			if (HEADER_ROW_RE.test(line) || NOISE_RE.test(line)) continue
			transactions[transactions.length - 1].description += ` ${line}`
		}

		return transactions
	}
}
