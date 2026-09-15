import { describe, expect, it } from 'vitest'
import { tbankParser } from './tbank'

const STATEMENT_TEXT = [
	'АО "Т-Банк"',
	'Выписка по счёту',
	'01.03.2026 Оплата подписки Яндекс Плюс -399,00 12000,00',
	'02.03.2026 Пополнение с карты 5000,00 17000,00'
].join('\n')

describe('tbankParser.match', () => {
	it('recognizes the Т-Банк header', () => {
		expect(tbankParser.match(STATEMENT_TEXT)).toBe(true)
	})

	it('recognizes the former Tinkoff branding', () => {
		expect(tbankParser.match('Tinkoff Bank statement')).toBe(true)
	})

	it('does not match another bank', () => {
		expect(tbankParser.match('ПАО Сбербанк')).toBe(false)
	})
})

describe('tbankParser.parse', () => {
	it('extracts transactions with RUB as the default currency', () => {
		const transactions = tbankParser.parse(STATEMENT_TEXT)

		expect(transactions).toHaveLength(2)
		expect(transactions[0]).toEqual({
			date: '2026-03-01',
			description: 'Оплата подписки Яндекс Плюс',
			amount: -399,
			currency: 'RUB',
			balance: 12000
		})
		expect(transactions[1]).toEqual({
			date: '2026-03-02',
			description: 'Пополнение с карты',
			amount: 5000,
			currency: 'RUB',
			balance: 17000
		})
	})
})
