import { describe, expect, it } from 'vitest'
import { sberbankParser } from './sberbank'

const STATEMENT_TEXT = [
	'ПАО Сбербанк',
	'Выписка по счёту',
	'01.03.2026 Оплата поставщику ООО Ромашка 1500,00 0,00 45000,00',
	'02.03.2026 Поступление зарплаты 0,00 60000,00 105000,00'
].join('\n')

describe('sberbankParser.match', () => {
	it('recognizes the bank header', () => {
		expect(sberbankParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('recognizes the Latin spelling too', () => {
		expect(sberbankParser.match('Sberbank statement export')).toBe(true)
	})

	it('does not match another bank', () => {
		expect(sberbankParser.match('Банк ВТБ (ПАО)')).toBe(false)
	})
})

describe('sberbankParser.parse', () => {
	it('reads DD.MM.YYYY dates and a debit/credit/balance layout with RUB default currency', () => {
		const transactions = sberbankParser.parse(STATEMENT_TEXT)

		expect(transactions).toHaveLength(2)
		expect(transactions[0]).toEqual({
			date: '2026-03-01',
			description: 'Оплата поставщику ООО Ромашка',
			amount: -1500,
			currency: 'RUB',
			balance: 45000
		})
		expect(transactions[1]).toEqual({
			date: '2026-03-02',
			description: 'Поступление зарплаты',
			amount: 60000,
			currency: 'RUB',
			balance: 105000
		})
	})
})
