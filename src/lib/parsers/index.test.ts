import { describe, expect, it } from 'vitest'
import { PARSERS, findParser, findParserWithFallback } from './index'

const MAIB_TEXT = 'B.C. "Moldova Agroindbank" S.A.\n01.03.2026 Test 10,00 100,00'

const HEADER_BY_BANK_CODE: Record<string, string> = {
	maib: 'B.C. "Moldova Agroindbank" S.A.',
	'maib-card': 'MAIB S.A. Conturi de Card Denumirea Contra Părții',
	victoriabank: 'Victoriabank',
	moldindconbank: 'B.C. "Moldindconbank" S.A.',
	sberbank: 'ПАО Сбербанк',
	tbank: 'АО "Т-Банк"',
	vtb: 'Банк ВТБ (ПАО)'
}

describe('findParser', () => {
	it('returns the matching bank parser', () => {
		expect(findParser(MAIB_TEXT)?.bankCode).toBe('maib')
	})

	it('returns null for a layout no registered parser recognizes', () => {
		expect(findParser('Some Unknown Bank Ltd. statement')).toBeNull()
	})

	// maib-card's header text is a real card statement's own header, which
	// always mentions "MAIB" too — maibParser's generic MAIB markers
	// legitimately also match it. That overlap is resolved by PARSERS'
	// order (maibCardParser listed first — see the comment there), not by
	// mutual exclusivity, so it's the one documented exception below.
	const KNOWN_OVERLAPS: Record<string, string[]> = {
		'maib-card': ['maib']
	}

	it('routes every registered bank to itself, and to no one else (except documented overlaps)', () => {
		expect(Object.keys(HEADER_BY_BANK_CODE).sort()).toEqual(
			PARSERS.map(p => p.bankCode).sort()
		)

		for (const parser of PARSERS) {
			const header = HEADER_BY_BANK_CODE[parser.bankCode]
			expect(findParser(header)?.bankCode).toBe(parser.bankCode)

			for (const other of PARSERS) {
				if (other.bankCode === parser.bankCode) continue
				if (KNOWN_OVERLAPS[parser.bankCode]?.includes(other.bankCode)) continue
				expect(other.match(header)).toBe(false)
			}
		}
	})
})

describe('findParserWithFallback', () => {
	it('uses the specific parser (not the fallback) when one matches', () => {
		const { parser, isFallback } = findParserWithFallback(MAIB_TEXT)
		expect(parser.bankCode).toBe('maib')
		expect(isFallback).toBe(false)
	})

	it('falls back to the generic parser instead of returning null', () => {
		const { parser, isFallback } = findParserWithFallback(
			'Some Unknown Bank Ltd. statement'
		)
		expect(parser.bankCode).toBe('generic')
		expect(isFallback).toBe(true)
	})

	it('never throws for an unrecognized layout — no 500s', () => {
		for (const text of ['', 'garbage', 'a'.repeat(10_000)]) {
			expect(() => findParserWithFallback(text)).not.toThrow()
			expect(() => findParserWithFallback(text).parser.parse(text)).not.toThrow()
		}
	})
})
