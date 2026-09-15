import { describe, expect, it } from 'vitest'
import { genericParser } from './generic'

describe('genericParser.match', () => {
	it('matches anything (it is the last-resort fallback)', () => {
		expect(genericParser.match('')).toBe(true)
		expect(genericParser.match('completely unrelated text')).toBe(true)
		expect(genericParser.match('Some Unknown Bank Ltd.')).toBe(true)
	})
})

describe('genericParser.parse', () => {
	it('extracts date-led, amount-trailing rows without assuming a currency', () => {
		const text = [
			'Some Unknown Bank Ltd. — statement',
			'01.03.2026 Payment to supplier 150.00 4520.35',
			'02.03.2026 Salary deposit 2000.00 6520.35'
		].join('\n')

		const transactions = genericParser.parse(text)

		expect(transactions).toHaveLength(2)
		expect(transactions[0]).toMatchObject({
			date: '2026-03-01',
			description: 'Payment to supplier',
			amount: 150,
			currency: ''
		})
		expect(transactions[1]).toMatchObject({
			date: '2026-03-02',
			description: 'Salary deposit',
			amount: 2000
		})
	})

	it('never throws and returns an empty list for garbage input', () => {
		expect(() => genericParser.parse('')).not.toThrow()
		expect(genericParser.parse('')).toEqual([])

		expect(() => genericParser.parse('¯\\_(ツ)_/¯ not a statement at all')).not.toThrow()
		expect(genericParser.parse('¯\\_(ツ)_/¯ not a statement at all')).toEqual([])

		const binaryish = String.fromCharCode(0, 1, 2, 255, 254) + '\n\t\r'
		expect(() => genericParser.parse(binaryish)).not.toThrow()
	})
})
