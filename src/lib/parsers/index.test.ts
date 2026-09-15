import { describe, expect, it } from 'vitest'
import { findParser, findParserWithFallback } from './index'

const MAIB_TEXT = 'B.C. "Moldova Agroindbank" S.A.\n01.03.2026 Test 10,00 100,00'

describe('findParser', () => {
	it('returns the matching bank parser', () => {
		expect(findParser(MAIB_TEXT)?.bankCode).toBe('maib')
	})

	it('returns null for a layout no registered parser recognizes', () => {
		expect(findParser('Some Unknown Bank Ltd. statement')).toBeNull()
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
