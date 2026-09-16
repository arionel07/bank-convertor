import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { beforeAll, describe, expect, it } from 'vitest'
import { findParser } from './index'
import { maibCardParser } from './maib-card'
import type { Transaction } from './types'

const FIXTURE_PATH = fileURLToPath(new URL('./fixtures/maib-card.pdf', import.meta.url))

// The real bank statement (marked "SPECIMEN — date fictive, pentru
// testare" — fictional test data, not a real customer's) — see the doc
// comment on maibCardParser for why a card-account statement needs its
// own parser: the description narrative can contain a "-<amount> lei"
// phrase that looks like a real amount but isn't one.
let STATEMENT_TEXT: string
let transactions: Transaction[]

beforeAll(async () => {
	const buf = readFileSync(FIXTURE_PATH)
	STATEMENT_TEXT = await extractPdfText(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
	)
	transactions = maibCardParser.parse(STATEMENT_TEXT)
})

describe('maibCardParser.match', () => {
	it('recognizes the real card-statement header', () => {
		expect(maibCardParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('the bank parser registry routes this statement to maib-card, not the operational maib parser', () => {
		expect(findParser(STATEMENT_TEXT)?.bankCode).toBe('maib-card')
	})
})

describe('maibCardParser.parse (real samples/maib-card.pdf)', () => {
	it('extracts all 8 transactions', () => {
		expect(transactions).toHaveLength(8)
	})

	it('REGRESSION: an amount mentioned inside the description narrative ("-2292.07 lei") is not mistaken for the real Debit/Credit — the real Credit (2,292.07) is used instead', () => {
		const tx = transactions.find(t => t.documentNumber === '0424547')
		expect(tx?.description).toContain('-2292.07 lei')
		expect(tx?.amount).toBe(2292.07)
	})

	it('extracts the counterparty name printed with no gap right after Credit', () => {
		expect(transactions.every(t => t.counterparty)).toBe(true)
		expect(transactions[0].counterparty).toBe('GRITIUC VIORICA')
	})

	it('the one refund ("Restituire") is incoming, every purchase/transfer is outgoing', () => {
		const refund = transactions.find(t => /restituire/i.test(t.description))
		expect(refund?.amount).toBeGreaterThan(0)

		const purchases = transactions.filter(t => /achizi[țt]ie/i.test(t.description))
		for (const p of purchases) expect(p.amount).toBeLessThan(0)
	})
})
