import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

/**
 * Last-resort parser: no bank in the registry recognized this statement's
 * header text. Rather than fail outright, try the same generic date-led/
 * amount-trailing heuristic every other parser uses, just without
 * assuming a currency. /api/parse treats a match from this parser as a
 * "used generic extraction" warning rather than a hard error — see
 * findParserWithFallback() in ./index.ts.
 */
export const genericParser: BankParser = {
	bankCode: 'generic',
	bankName: 'Generic',

	match() {
		return true
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: '' })
	}
}
