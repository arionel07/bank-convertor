import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { transactionsTo1C } from '@/lib/export/onec'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { beforeAll, describe, expect, it } from 'vitest'
import { moldindconbankParser } from './moldindconbank'
import type { Transaction } from './types'

const FIXTURE_PATH = fileURLToPath(
	new URL('./fixtures/moldindconbank.pdf', import.meta.url)
)

// The real bank statement (marked "SPECIMEN — date fictive, pentru
// testare" — fictional test data, not a real customer's) — see the doc
// comment on moldindconbankParser for why this bank needs its own parser
// rather than the shared generic one.
let STATEMENT_TEXT: string
let transactions: Transaction[]

beforeAll(async () => {
	const buf = readFileSync(FIXTURE_PATH)
	STATEMENT_TEXT = await extractPdfText(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
	)
	transactions = moldindconbankParser.parse(STATEMENT_TEXT)
})

describe('moldindconbankParser.match', () => {
	it('recognizes the real statement header', () => {
		expect(moldindconbankParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('does not match another bank', () => {
		expect(moldindconbankParser.match('Victoriabank statement')).toBe(false)
	})
})

describe('moldindconbankParser.parse (real samples/moldindconbank.pdf)', () => {
	it('extracts all 9 transactions', () => {
		expect(transactions).toHaveLength(9)
	})

	it('REGRESSION: totals match the statement\'s own footer ("Total debite: 7,124.00 Total credite: 8,150.00")', () => {
		const debit = transactions
			.filter(t => t.amount < 0)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0)
		const credit = transactions
			.filter(t => t.amount > 0)
			.reduce((sum, t) => sum + t.amount, 0)

		expect(debit).toBeCloseTo(7124.0, 2)
		expect(credit).toBeCloseTo(8150.0, 2)
	})

	it('DIRECTION REGRESSION: both "încasare" rows (doc 5503 -> 6700, doc 5507 -> 1450) are incoming', () => {
		const doc5503 = transactions.find(t => t.documentNumber === '5503')
		const doc5507 = transactions.find(t => t.documentNumber === '5507')

		expect(doc5503?.amount).toBe(6700)
		expect(doc5507?.amount).toBe(1450)
	})

	it('DIRECTION REGRESSION: "Plată"/"Achitare"/comission rows are all outgoing (negative)', () => {
		for (const t of transactions) {
			if (/plat[ăa]|achitare|comision/i.test(t.description)) {
				expect(t.amount).toBeLessThan(0)
			}
		}
	})

	it('extracts the counterparty name for every row', () => {
		expect(transactions.every(t => t.counterparty)).toBe(true)
	})

	it('DIRECTION REGRESSION: exported to 1C, the two încasare rows get ПолучательСчет=own account, the rest get ПлательщикСчет', () => {
		const account = { accountNumber: 'MD11AG000000000123456', accountHolder: 'TEST SRL' }
		const text = transactionsTo1C(transactions, account)
		const blocks = text
			.split('СекцияДокумент=Платежное поручение')
			.slice(1)
			.map(block => block.split('КонецДокумента')[0])

		for (const [i, t] of transactions.entries()) {
			if (t.amount > 0) {
				expect(blocks[i]).toContain(`ПолучательСчет=${account.accountNumber}`)
			} else {
				expect(blocks[i]).toContain(`ПлательщикСчет=${account.accountNumber}`)
			}
		}
	})
})
