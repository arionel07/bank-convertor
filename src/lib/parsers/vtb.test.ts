import { describe, expect, it } from 'vitest'
import { vtbParser } from './vtb'

const STATEMENT_TEXT = [
	'Банк ВТБ (ПАО)',
	'Выписка по счёту',
	'01.03.2026 Списание комиссия обслуживание -150,00 89000,00',
	'02.03.2026 Зачисление перевод 20000,00 109000,00'
].join('\n')

describe('vtbParser.match', () => {
	it('recognizes the bank header', () => {
		expect(vtbParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('recognizes the Latin abbreviation', () => {
		expect(vtbParser.match('VTB Bank statement export')).toBe(true)
	})

	it('does not match another bank', () => {
		expect(vtbParser.match('АО "Т-Банк"')).toBe(false)
	})
})

describe('vtbParser.parse', () => {
	it('extracts transactions with RUB as the default currency', () => {
		const transactions = vtbParser.parse(STATEMENT_TEXT)

		expect(transactions).toHaveLength(2)
		expect(transactions[0]).toEqual({
			date: '2026-03-01',
			description: 'Списание комиссия обслуживание',
			amount: -150,
			currency: 'RUB',
			balance: 89000
		})
		expect(transactions[1]).toEqual({
			date: '2026-03-02',
			description: 'Зачисление перевод',
			amount: 20000,
			currency: 'RUB',
			balance: 109000
		})
	})
})
