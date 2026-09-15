import type { BankParser } from './types'
import { parseDateLedLines } from './shared'

// NOTE: written without a real Sberbank statement sample to calibrate
// against (none was available in this environment — see
// /samples/README.md). Targets the standard debit/credit/balance layout
// with DD.MM.YYYY dates, same shared heuristic as every other parser here.
// No \b around the Cyrillic markers: JS regex's default \w (hence \b)
// only covers ASCII, so a \b next to a Cyrillic letter can fail to match
// where you'd expect it to.
const HEADER_MARKERS = [/сбербанк/i, /sberbank/i, /пао\s*сбербанк/i]

export const sberbankParser: BankParser = {
	bankCode: 'sberbank',
	bankName: 'Сбербанк',

	match(text) {
		return HEADER_MARKERS.some(re => re.test(text))
	},

	parse(text) {
		return parseDateLedLines(text, { defaultCurrency: 'RUB' })
	}
}
