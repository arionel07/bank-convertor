import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

// NOTE: written without a real Victoriabank statement sample to calibrate
// against (none was available in this environment — see
// /samples/README.md). Uses the same date-led/amount-trailing layout as
// maib.ts, which is the common shape for Moldovan bank statements.
const HEADER_MARKERS = [/victoriabank/i, /b\.?c\.?\s*[""]?victoriabank/i]

export const victoriabankParser: BankParser = {
	bankCode: 'victoriabank',
	bankName: 'Victoriabank',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: 'MDL' })
	}
}
