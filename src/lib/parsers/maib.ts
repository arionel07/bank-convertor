import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

// NOTE: written without a real maib statement sample to calibrate against
// (none was available in this environment — see /samples/README.md).
const HEADER_MARKERS = [
	/moldova\s*agroindbank/i,
	/\bmaib\b/i,
	/b\.?c\.?\s*[""]?moldova agroindbank/i
]

export const maibParser: BankParser = {
	bankCode: 'maib',
	bankName: 'Moldova Agroindbank (maib)',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: 'MDL' })
	}
}
