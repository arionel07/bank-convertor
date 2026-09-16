import { describe, expect, it } from 'vitest'
import { extractAccount } from './account-header'

describe('extractAccount', () => {
	it('reads "Număr cont:" (Romanian, maib/Victoriabank/Moldindconbank style)', () => {
		const text = [
			'B.C. "Moldova Agroindbank" S.A.',
			'Extras de cont',
			'Titular: TEST SRL',
			'Număr cont: MD24AG000000225100104864',
			'Data Descriere Debit Credit Sold'
		].join('\n')

		const account = extractAccount(text)
		expect(account.accountNumber).toBe('MD24AG000000225100104864')
		expect(account.accountHolder).toBe('TEST SRL')
	})

	it('reads "Cont:" on its own', () => {
		const text = ['Victoriabank', 'Cont: MD88VB0000000225100104864'].join(
			'\n'
		)

		expect(extractAccount(text).accountNumber).toBe(
			'MD88VB0000000225100104864'
		)
	})

	it('reads a plain numeric "Cont:" (no IBAN)', () => {
		const text = ['Moldindconbank', 'Cont: 22510010486400'].join('\n')

		expect(extractAccount(text).accountNumber).toBe('22510010486400')
	})

	it('reads Russian "Счет №"', () => {
		const text = ['ПАО Сбербанк', 'Счет № 40702810900000012345'].join('\n')

		expect(extractAccount(text).accountNumber).toBe('40702810900000012345')
	})

	it('reads Russian "Р/с"', () => {
		const text = ['Банк ВТБ (ПАО)', 'Р/с: 40702810900000098765'].join('\n')

		expect(extractAccount(text).accountNumber).toBe('40702810900000098765')
	})

	it('falls back to a bare IBAN-shaped token when no label matches', () => {
		const text = ['Some Bank', 'MD24AG000000225100104864 statement'].join(
			'\n'
		)

		expect(extractAccount(text).accountNumber).toBe(
			'MD24AG000000225100104864'
		)
	})

	it('only looks at the header region, not the whole document', () => {
		const longPreamble = Array.from(
			{ length: 25 },
			(_, i) => `line ${i}`
		).join('\n')
		const text = `${longPreamble}\nCont: MD24AG000000225100104864`

		expect(extractAccount(text).accountNumber).toBeUndefined()
	})

	it('returns undefined fields rather than throwing when nothing matches', () => {
		expect(() => extractAccount('')).not.toThrow()
		const account = extractAccount('Unrelated text with no account info')
		expect(account.accountNumber).toBeUndefined()
		expect(account.accountHolder).toBeUndefined()
	})
})
