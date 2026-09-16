import type { ParsedAccount } from './types'

// Only look at the first few lines: statement headers put the account
// info near the top, and searching the whole document risks matching
// an unrelated occurrence of "cont"/"счет" inside a transaction
// description further down.
const HEADER_LINE_COUNT = 20

const ACCOUNT_NUMBER_PATTERNS = [
	// "Număr cont: MD24AG000000225100104864" / "Număr cont IBAN: ..."
	/num[aă]r\s*cont(?:\s*iban)?\s*[:\-]?\s*([A-Z]{2}\d{2}[A-Z0-9]{4,30}|\d{5,24})/i,
	// "Cont: ..." / "Cont curent: ..." / "Cont IBAN: ..."
	/\bcont(?:\s*curent)?(?:\s*iban)?\s*[:\-]?\s*([A-Z]{2}\d{2}[A-Z0-9]{4,30}|\d{5,24})/i,
	// "Счет №..." / "Счёт:..." / "Расчетный счет ..."
	/сч[её]т\s*(?:№|no\.?|номер)?\s*[:\-]?\s*(\d{5,24})/i,
	// "Р/с ..."
	/р\/с\s*[:\-]?\s*(\d{5,24})/i
]

// Fallback when none of the labeled patterns hit: a bare IBAN-shaped
// token anywhere in the header. Not restricted to MD (Moldovan IBANs) —
// this registry also has RU banks, whose account numbers aren't IBANs
// at all, so this fallback mainly helps the two MD banks.
const IBAN_FALLBACK_RE = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/

const ACCOUNT_HOLDER_PATTERNS = [
	/titular\s*[:\-]?\s*([^\n\r]{3,80})/i,
	/client\s*[:\-]?\s*([^\n\r]{3,80})/i,
	/deponent\s*[:\-]?\s*([^\n\r]{3,80})/i,
	/клиент\s*[:\-]?\s*([^\n\r]{3,80})/i,
	/наименование\s*(?:клиента|организации)?\s*[:\-]?\s*([^\n\r]{3,80})/i
]

function headerRegion(text: string): string {
	return text.split('\n').slice(0, HEADER_LINE_COUNT).join('\n')
}

/**
 * Best-effort extraction of "whose statement is this" from the PDF's own
 * header text — not calibrated against a real sample (see
 * /samples/README.md), same caveat as every parser in this directory.
 * Getting this right matters beyond cosmetics: the 1C export
 * (src/lib/export/onec.ts) uses accountNumber to decide which side of
 * each payment is "us" — without it, every transaction looks the same
 * to 1C's importer regardless of debit/credit.
 */
export function extractAccount(text: string): ParsedAccount {
	const header = headerRegion(text)

	let accountNumber: string | undefined
	for (const re of ACCOUNT_NUMBER_PATTERNS) {
		const m = header.match(re)
		if (m?.[1]) {
			accountNumber = m[1]
			break
		}
	}
	if (!accountNumber) accountNumber = header.match(IBAN_FALLBACK_RE)?.[0]

	let accountHolder: string | undefined
	for (const re of ACCOUNT_HOLDER_PATTERNS) {
		const m = header.match(re)
		if (m?.[1]) {
			accountHolder = m[1].trim()
			break
		}
	}

	return { accountNumber, accountHolder }
}
