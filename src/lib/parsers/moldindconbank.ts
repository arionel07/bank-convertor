import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

// NOTE: written without a real Moldindconbank statement sample to
// calibrate against (none was available in this environment — see
// /samples/README.md). Uses the same date-led/amount-trailing layout as
// maib.ts, which is the common shape for Moldovan bank statements.
const HEADER_MARKERS = [
	/moldindconbank/i,
	/\bmicb\b/i,
	/b\.?c\.?\s*[""]?moldindconbank/i
]

export const moldindconbankParser: BankParser = {
	bankCode: 'moldindconbank',
	bankName: 'Moldindconbank',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: 'MDL' })
	}
}
