import type { Transaction } from './types'

// dd.mm.yyyy (MD banks) and dd/mm/yyyy (confirmed on the real
// samples/maib-operational.pdf) both occur in practice; dd-mm-yyyy is
// supported the same way even though no sample uses it yet. The two
// separators in one date must match each other (a real statement never
// mixes "." and "/" within one date), enforced with a backreference.
export const DATE_RE = /\b(\d{2})([./-])(\d{2})\2(\d{2,4})\b/

/**
 * Matches one full amount column, in whichever of these shapes it's
 * printed in — critically, as ONE token including any thousands
 * grouping, not just the trailing decimal part:
 *
 *   -?\d{1,3}(,\d{3})+\.\d{2}   2,340.00       (comma thousands, dot decimal)
 *   -?\d{1,3}( \d{3})+,\d{2}    12 500,00      (space thousands, comma decimal)
 *   -?\d{1,3}(\.\d{3})+,\d{2}   12.500,00      (dot thousands, comma decimal)
 *   -?\d+\.\d{2}                1875.40 / -2292.07  (no thousands, dot decimal)
 *   -?\d+,\d{2}                 875,40         (no thousands, comma decimal)
 *
 * Alternation order matters: a grouped form must be tried before the
 * plain forms, otherwise e.g. "2,340.00" would match only its "340.00"
 * tail (regex takes the first alternative that succeeds at a given
 * start position, not the longest overall) — that's the exact bug this
 * shape was rewritten to fix: the old plain-only regex silently
 * truncated grouped amounts and leaked the dropped leading digits into
 * the transaction description.
 *
 * Known residual ambiguity: a single-space-group amount ("12 500,00")
 * is syntactically identical to "<3-digit reference number> <amount>"
 * (e.g. "nr 118 300,00") — regex alone can't tell those apart. Comma-
 * and dot-thousands don't have this problem in practice (a reference
 * number immediately followed by ",\d{3}." or ".\d{3}," is far less
 * likely to occur than one followed by a bare space).
 */
export const AMOUNT_TOKEN_RE =
	/-?\d{1,3}(?:,\d{3})+\.\d{2}\b|-?\d{1,3}(?: \d{3})+,\d{2}\b|-?\d{1,3}(?:\.\d{3})+,\d{2}\b|-?\d+\.\d{2}\b|-?\d+,\d{2}\b/g

/**
 * Normalizes any of the AMOUNT_TOKEN_RE shapes to a JS number. Format-
 * agnostic by design: whichever of "." or "," appears LAST in the string
 * is the decimal separator (our token regex guarantees it's followed by
 * exactly 2 digits); everything before it is the integer part, stripped
 * of any grouping characters (the other punctuation mark, or spaces).
 */
export function parseAmount(raw: string): number {
	const trimmed = raw.trim()
	const isNegative = trimmed.startsWith('-')
	const digits = isNegative ? trimmed.slice(1) : trimmed

	const lastDot = digits.lastIndexOf('.')
	const lastComma = digits.lastIndexOf(',')
	const decimalPos = Math.max(lastDot, lastComma)
	if (decimalPos === -1) {
		const value = Number.parseFloat(digits)
		return isNegative ? -value : value
	}

	const integerPart = digits.slice(0, decimalPos).replace(/[.,\s]/g, '')
	const fractionPart = digits.slice(decimalPos + 1)
	const value = Number.parseFloat(`${integerPart}.${fractionPart}`)
	return isNegative ? -value : value
}

export function toIsoDate(raw: string): string | null {
	const m = raw.match(DATE_RE)
	if (!m) return null
	const [, dd, , mm, yy] = m
	const year = yy.length === 2 ? `20${yy}` : yy
	return `${year}-${mm}-${dd}`
}

/**
 * Shared date-led, amount-trailing line parser used by every bank parser
 * in the registry (and the generic fallback). A transaction row is
 * assumed to start with (or be very close to starting with) a date,
 * optionally followed by a value date, then free text, then 1-3 trailing
 * amount columns: [amount, balance] or [debit, credit, balance] (or, with
 * `swapDebitCredit`, [credit, debit, balance] — see below).
 *
 * None of these parsers have been calibrated against a real statement
 * PDF (see /samples/README.md) — this is a best-effort layout shared
 * across MD/RU bank statements' common tabular shape, not a guarantee
 * any specific bank's real export matches it exactly.
 */
export function parseDateLedLines(
	text: string,
	{
		defaultCurrency,
		swapDebitCredit = false
	}: {
		defaultCurrency: string
		/**
		 * When a row prints 3 trailing amount columns, this module's default
		 * assumes [Debit, Credit, Balance] order — confirmed against the real
		 * samples/moldindconbank.pdf, which uses this same order (an earlier
		 * fix wrongly flagged it as reversed based on a synthetic
		 * reconstruction rather than the real file — see moldindconbank.ts).
		 * Set true only for a bank whose real statement is verified to print
		 * credit before debit; getting this wrong silently inverts every
		 * transaction's sign in the 1C export.
		 */
		swapDebitCredit?: boolean
	}
): Transaction[] {
	const transactions: Transaction[] = []

	for (const rawLine of text.split('\n')) {
		const line = rawLine.trim()
		if (!line) continue

		const dateMatch = line.match(DATE_RE)
		// a transaction row starts with (or very close to) its date
		if (!dateMatch || dateMatch.index === undefined || dateMatch.index > 4) {
			continue
		}
		const date = toIsoDate(dateMatch[0])
		if (!date) continue

		let descriptionStart = dateMatch.index + dateMatch[0].length
		const valueDateMatch = line
			.slice(descriptionStart)
			.match(new RegExp(`^\\s*${DATE_RE.source}`))
		if (valueDateMatch) descriptionStart += valueDateMatch[0].length

		// Only look for amount tokens after the date(s) — the date itself
		// (dd.mm.yyyy) can otherwise false-match as e.g. "dd.mm".
		const rest = line.slice(descriptionStart)
		const amountMatches = [...rest.matchAll(AMOUNT_TOKEN_RE)]
		if (amountMatches.length === 0) continue

		// amount/credit/balance columns are always the trailing numeric
		// tokens on the row — take the last 2 (amount, balance) or, when a
		// third trails them too, the last 3 (debit, credit, balance).
		const trailingCount = Math.min(amountMatches.length, 3)
		const usedMatches = amountMatches.slice(-trailingCount)
		const amountTokens = usedMatches.map(m => m[0])
		const descriptionEnd = descriptionStart + usedMatches[0].index

		const description = line
			.slice(descriptionStart, descriptionEnd)
			.replace(/\s+/g, ' ')
			.trim()
		if (!description) continue

		let amount: number
		let balance: number | undefined

		if (amountTokens.length >= 3) {
			const [first, second, bal] = amountTokens.map(parseAmount)
			const [debit, credit] = swapDebitCredit ? [second, first] : [first, second]
			amount = credit - Math.abs(debit)
			balance = bal
		} else if (amountTokens.length === 2) {
			const [amt, bal] = amountTokens.map(parseAmount)
			amount = amt
			balance = bal
		} else {
			amount = parseAmount(amountTokens[0])
		}

		if (Number.isNaN(amount)) continue

		transactions.push({
			date,
			description,
			amount,
			currency: defaultCurrency,
			balance:
				balance !== undefined && !Number.isNaN(balance) ? balance : undefined
		})
	}

	return transactions
}
