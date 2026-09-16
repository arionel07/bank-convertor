import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { transactionsTo1C } from '@/lib/export/onec'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { beforeAll, describe, expect, it } from 'vitest'
import { maibParser } from './maib'
import type { Transaction } from './types'

const FIXTURE_PATH = fileURLToPath(
	new URL('./fixtures/maib-operational.pdf', import.meta.url)
)

// The real bank statement (marked "SPECIMEN — date fictive, pentru
// testare" — fictional test data, not a real customer's) — see the doc
// comment on maibParser for the real-file quirks (slash dates, glued
// columns, wrapped rows, a table header repeated on every page) this
// parser has to handle that a generic parseDateLedLines row can't.
let STATEMENT_TEXT: string
let transactions: Transaction[]

beforeAll(async () => {
	const buf = readFileSync(FIXTURE_PATH)
	STATEMENT_TEXT = await extractPdfText(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
	)
	transactions = maibParser.parse(STATEMENT_TEXT)
})

describe('maibParser.match', () => {
	it('recognizes the real statement header', () => {
		expect(maibParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('does not match unrelated text', () => {
		expect(maibParser.match('Victoriabank statement, some text')).toBe(false)
	})
})

describe('maibParser.parse (real samples/maib-operational.pdf)', () => {
	it('extracts exactly 15 transactions across all 4 pages, ignoring the table header repeated on each one', () => {
		expect(transactions).toHaveLength(15)
	})

	it('REGRESSION: totals match the statement\'s own math (footer "Total 5,099.01 22,500.00" and Sold final 2,558.00 + 22,500.00 - 5,099.01 = 19,958.99 "Total generală")', () => {
		const debit = transactions
			.filter(t => t.amount < 0)
			.reduce((sum, t) => sum + Math.abs(t.amount), 0)
		const credit = transactions
			.filter(t => t.amount > 0)
			.reduce((sum, t) => sum + t.amount, 0)

		expect(debit).toBeCloseTo(5099.01, 2)
		expect(credit).toBeCloseTo(22500.0, 2)
	})

	it('parses both rows where the date, doc number and counterparty are rendered with no space at all between them', () => {
		const glued1 = transactions.find(t => t.documentNumber === '8788608001')
		const glued2 = transactions.find(t => t.documentNumber === '6440148508')

		expect(glued1).toMatchObject({ date: '2026-09-07', amount: -50 })
		expect(glued2).toMatchObject({ date: '2026-09-21', amount: -50 })
	})

	it('the two incoming transactions (GOLDEN REST SRL 20,000.00 + JOHANNES GROUP SRL 2,500.00, summing to the 22,500.00 credit total) are positive, everything else is negative', () => {
		const incoming = transactions.filter(t => t.amount > 0)
		expect(incoming).toHaveLength(2)
		expect(incoming).toEqual([
			expect.objectContaining({ amount: 20000, counterparty: 'GOLDEN REST SRL' }),
			expect.objectContaining({ amount: 2500, counterparty: 'JOHANNES GROUP SRL' })
		])
	})

	it('glues wrapped continuation lines onto the previous row instead of reading them as separate transactions', () => {
		const rentPayment = transactions.find(t => t.documentNumber === '3')
		expect(rentPayment?.description).toContain('contractului nr. 7')
		expect(rentPayment?.description).toContain('sumei lunare')
	})

	it('DIRECTION REGRESSION: exported to 1C, the incoming row gets ПолучательСчет=own account, outgoing rows get ПлательщикСчет', () => {
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
