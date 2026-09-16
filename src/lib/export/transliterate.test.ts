import { describe, expect, it } from 'vitest'
import { transliterate, transliterateRomanianDiacritics } from './transliterate'

describe('transliterate', () => {
	it('converts Cyrillic to Latin', () => {
		expect(transliterate('Плательщик')).toBe('Platelshchik')
		expect(transliterate('Сбербанк')).toBe('Sberbank')
	})

	it('converts Romanian diacritics (both cedilla and comma-below forms)', () => {
		expect(transliterate('Achitare mărfuri către SRL')).toBe(
			'Achitare marfuri catre SRL'
		)
		expect(transliterate('ăâîșț ĂÂÎȚȘ')).toBe('aaist AAITS')
		expect(transliterate('ăâîşţ ĂÂÎŢŞ')).toBe('aaist AAITS')
	})

	it('leaves plain ASCII untouched', () => {
		expect(transliterate('Invoice #118, SC XYZ SRL')).toBe(
			'Invoice #118, SC XYZ SRL'
		)
	})

	it('handles mixed Cyrillic + Romanian + ASCII in one string', () => {
		expect(transliterate('Плата către ООО Ромашка')).toBe(
			'Plata catre OOO Romashka'
		)
	})
})

describe('transliterateRomanianDiacritics', () => {
	it('converts Romanian diacritics but leaves Cyrillic untouched', () => {
		expect(transliterateRomanianDiacritics('Plată întreținere')).toBe(
			'Plata intretinere'
		)
		expect(transliterateRomanianDiacritics('Плата către клиент')).toBe(
			'Плата catre клиент'
		)
	})

	it('leaves plain ASCII untouched', () => {
		expect(transliterateRomanianDiacritics('Invoice #118, SC XYZ SRL')).toBe(
			'Invoice #118, SC XYZ SRL'
		)
	})
})
