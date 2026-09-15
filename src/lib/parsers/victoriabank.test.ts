import { describe, expect, it } from 'vitest'
import { victoriabankParser } from './victoriabank'

const STATEMENT_TEXT = [
	'Victoriabank',
	'Extras de cont',
	'01.03.2026 Plata furnizor ABC SRL 200,00 3100,50',
	'02.03.2026 02.03.2026 Incasare vanzare produse 450,00 3550,50'
].join('\n')

describe('victoriabankParser.match', () => {
	it('recognizes the bank header', () => {
		expect(victoriabankParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('does not match another bank', () => {
		expect(victoriabankParser.match('B.C. "Moldova Agroindbank" S.A.')).toBe(
			false
		)
	})
})

describe('victoriabankParser.parse', () => {
	it('extracts transactions with MDL as the default currency', () => {
		const transactions = victoriabankParser.parse(STATEMENT_TEXT)

		expect(transactions).toHaveLength(2)
		expect(transactions[0]).toEqual({
			date: '2026-03-01',
			description: 'Plata furnizor ABC SRL',
			amount: 200,
			currency: 'MDL',
			balance: 3100.5
		})
		expect(transactions[1]).toEqual({
			date: '2026-03-02',
			description: 'Incasare vanzare produse',
			amount: 450,
			currency: 'MDL',
			balance: 3550.5
		})
	})
})
