import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

// NOTE: written without a real Т-Банк (formerly Tinkoff) statement sample
// to calibrate against (none was available in this environment — see
// /samples/README.md). Same shared date-led/amount-trailing heuristic as
// every other parser here — no \b around the Cyrillic marker, see
// sberbank.ts for why.
const HEADER_MARKERS = [/т-?банк/i, /tinkoff/i, /\bt-?bank\b/i]

export const tbankParser: BankParser = {
	bankCode: 'tbank',
	bankName: 'Т-Банк (Тинькофф)',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: 'RUB' })
	}
}
