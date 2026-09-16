import { describe, expect, it } from 'vitest'
import { AMOUNT_TOKEN_RE, parseAmount, parseDateLedLines } from './shared'

describe('parseAmount', () => {
	// The 5 formats from the bug report — a naive split-on-separator parser
	// gets #1 and #2 wrong (it reads "2,340.00" as 340 and "1,875.40" as
	// 875.40, dropping the thousands group entirely).
	it.each([
		['2,340.00', 2340],
		['1,875.40', 1875.4],
		['12 500,00', 12500],
		['875,40', 875.4],
		['-2292.07', -2292.07]
	])('parses %s as %s', (raw, expected) => {
		expect(parseAmount(raw)).toBeCloseTo(expected as number, 5)
	})

	it('handles multi-group thousands and negative grouped amounts', () => {
		expect(parseAmount('12,340,000.00')).toBeCloseTo(12340000, 5)
		expect(parseAmount('-1,875.40')).toBeCloseTo(-1875.4, 5)
		expect(parseAmount('-12 500,00')).toBeCloseTo(-12500, 5)
	})
})

describe('AMOUNT_TOKEN_RE', () => {
	it('matches each of the 5 formats as a single, complete token', () => {
		for (const raw of ['2,340.00', '1,875.40', '12 500,00', '875,40', '-2292.07']) {
			const matches = [...raw.matchAll(AMOUNT_TOKEN_RE)]
			expect(matches, `expected exactly one match in "${raw}"`).toHaveLength(1)
			expect(matches[0][0]).toBe(raw)
		}
	})
})

describe('parseDateLedLines — description must not get polluted by amount fragments', () => {
	it('keeps the full amount together for comma-thousands + dot-decimal', () => {
		const text = '01.03.2026 Achitare furnizor ABC SRL 2,340.00 15,200.00'
		const [tx] = parseDateLedLines(text, { defaultCurrency: 'MDL' })

		expect(tx.description).toBe('Achitare furnizor ABC SRL')
		expect(tx.amount).toBeCloseTo(2340, 5)
		expect(tx.balance).toBeCloseTo(15200, 5)
	})

	it('keeps the full amount together for space-thousands + comma-decimal', () => {
		const text = '01.03.2026 Incasare marfa en-gros 12 500,00 48 200,00'
		const [tx] = parseDateLedLines(text, { defaultCurrency: 'MDL' })

		expect(tx.description).toBe('Incasare marfa en-gros')
		expect(tx.amount).toBeCloseTo(12500, 5)
		expect(tx.balance).toBeCloseTo(48200, 5)
	})

	it('does not leak digits into the description for a plain-decimal amount', () => {
		const text = '01.03.2026 Comision lunar deservire cont 875,40 4795,35'
		const [tx] = parseDateLedLines(text, { defaultCurrency: 'MDL' })

		expect(tx.description).toBe('Comision lunar deservire cont')
		expect(tx.amount).toBeCloseTo(875.4, 5)
	})

	it('handles a negative plain-decimal debit/credit/balance row', () => {
		const text = '01.03.2026 Retragere numerar bancomat 2292.07 0.00 18450.00'
		const [tx] = parseDateLedLines(text, { defaultCurrency: 'MDL' })

		expect(tx.description).toBe('Retragere numerar bancomat')
		expect(tx.amount).toBeCloseTo(-2292.07, 5)
		expect(tx.balance).toBeCloseTo(18450, 5)
	})
})
