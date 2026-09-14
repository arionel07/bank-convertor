import type { BankParser, Transaction } from './types'

// NOTE: written without a real maib statement sample to calibrate against
// (none was available in this environment — see /samples/README.md). It
// targets the common Moldovan bank-statement layout: a line that starts
// with a transaction date, optionally followed by a value date, then a
// free-text description, then one or more trailing amount columns
// (debit/credit and/or running balance). Once a real maib.pdf is on hand,
// re-check the amount-token grouping (currently assumes the last 2 or 3
// numeric tokens on a line are [amount, balance] or [debit, credit,
// balance]) and the header markers below against actual output of
// extractPdfText().
const DATE_RE = /\b(\d{2})\.(\d{2})\.(\d{2,4})\b/
// Deliberately doesn't try to recognize thousands separators: a
// space/dot-grouped amount ("4 520,35" / "4.520,35") is indistinguishable
// from "an unrelated 3-digit reference number followed by a real amount"
// without a real sample to check against, and merging those silently is
// worse than just dropping the thousands digit. Revisit once samples/
// has a real maib.pdf.
const AMOUNT_TOKEN_RE = /-?\d+[.,]\d{2}\b/g

const HEADER_MARKERS = [
	/moldova\s*agroindbank/i,
	/\bmaib\b/i,
	/b\.?c\.?\s*[""]?moldova agroindbank/i
]

function toIsoDate(raw: string): string | null {
	const m = raw.match(DATE_RE)
	if (!m) return null
	const [, dd, mm, yy] = m
	const year = yy.length === 2 ? `20${yy}` : yy
	return `${year}-${mm}-${dd}`
}

function parseAmount(raw: string): number {
	const trimmed = raw.trim()
	// "1234,56" (comma decimal) -> "1234.56"; "1234.56" is used as-is.
	const isEuropean = /,\d{2}$/.test(trimmed)
	const normalized = isEuropean ? trimmed.replace(',', '.') : trimmed
	return Number.parseFloat(normalized)
}

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
				const [debit, credit, bal] = amountTokens.map(parseAmount)
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
				currency: 'MDL',
				balance: balance !== undefined && !Number.isNaN(balance) ? balance : undefined
			})
		}

		return transactions
	}
}
