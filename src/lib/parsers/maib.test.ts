import { describe, expect, it } from 'vitest'
import { maibParser } from './maib'

const STATEMENT_TEXT = [
	'B.C. "Moldova Agroindbank" S.A.',
	'Extras de cont',
	'Titular: TEST SRL',
	'Data Descriere Debit Credit Sold',
	'01.03.2026 Achitare marfa SC XYZ SRL 150,00 4520,35',
	'02.03.2026 02.03.2026 Incasare factura nr 118 300,00 4820,35',
	'03.03.2026 Comision lunar deservire cont 25,00 4795,35'
].join('\n')

describe('maibParser.match', () => {
	it('recognizes the bank header', () => {
		expect(maibParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('does not match unrelated text', () => {
		expect(maibParser.match('Victoriabank statement, some text')).toBe(false)
	})
})

describe('maibParser.parse', () => {
	it('extracts every transaction with correct date/description/amount/balance', () => {
		const transactions = maibParser.parse(STATEMENT_TEXT)

		expect(transactions).toHaveLength(3)
		expect(transactions[0]).toEqual({
			date: '2026-03-01',
			description: 'Achitare marfa SC XYZ SRL',
			amount: 150,
			currency: 'MDL',
			balance: 4520.35
		})
		expect(transactions[1]).toEqual({
			date: '2026-03-02',
			description: 'Incasare factura nr 118',
			amount: 300,
			currency: 'MDL',
			balance: 4820.35
		})
		expect(transactions[2]).toEqual({
			date: '2026-03-03',
			description: 'Comision lunar deservire cont',
			amount: 25,
			currency: 'MDL',
			balance: 4795.35
		})
	})

	it('reads a debit/credit/balance row as a signed net amount', () => {
		const text =
			'01.03.2026 Retragere numerar bancomat 50,00 0,00 4745,35'
		const [tx] = maibParser.parse(text)

		expect(tx.amount).toBe(-50)
		expect(tx.balance).toBe(4745.35)
	})

	it('ignores lines with no date or no amount', () => {
		const text = [
			'B.C. "Moldova Agroindbank" S.A.',
			'Extras de cont pentru perioada 01.03.2026 - 31.03.2026',
			'Data Descriere Debit Credit Sold'
		].join('\n')

		expect(maibParser.parse(text)).toEqual([])
	})
})
