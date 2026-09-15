import { describe, expect, it } from 'vitest'
import { moldindconbankParser } from './moldindconbank'

const STATEMENT_TEXT = [
	'B.C. "Moldindconbank" S.A.',
	'Extras de cont',
	'01.03.2026 Achitare chirie 500,00 2800,00',
	'02.03.2026 Incasare marfa 700,00 3500,00'
].join('\n')

describe('moldindconbankParser.match', () => {
	it('recognizes the bank header', () => {
		expect(moldindconbankParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('recognizes the MICB abbreviation', () => {
		expect(moldindconbankParser.match('Extras MICB pentru luna martie')).toBe(
			true
		)
	})

	it('does not match another bank', () => {
		expect(moldindconbankParser.match('Victoriabank statement')).toBe(false)
	})
})

describe('moldindconbankParser.parse', () => {
	it('extracts transactions with MDL as the default currency', () => {
		const transactions = moldindconbankParser.parse(STATEMENT_TEXT)

		expect(transactions).toHaveLength(2)
		expect(transactions[0]).toEqual({
			date: '2026-03-01',
			description: 'Achitare chirie',
			amount: 500,
			currency: 'MDL',
			balance: 2800
		})
		expect(transactions[1]).toEqual({
			date: '2026-03-02',
			description: 'Incasare marfa',
			amount: 700,
			currency: 'MDL',
			balance: 3500
		})
	})
})
