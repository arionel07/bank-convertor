import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

// NOTE: written without a real VTB statement sample to calibrate against
// (none was available in this environment — see /samples/README.md).
// Same shared date-led/amount-trailing heuristic as every other parser
// here — no \b around the Cyrillic marker, see sberbank.ts for why.
const HEADER_MARKERS = [/банк\s*втб/i, /\bvtb\b/i, /(?:^|\s)втб(?:\s|$)/i]

export const vtbParser: BankParser = {
	bankCode: 'vtb',
	bankName: 'ВТБ',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: 'RUB' })
	}
}
