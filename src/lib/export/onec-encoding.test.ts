import iconv from 'iconv-lite'
import { describe, expect, it } from 'vitest'
import { encode1CBytes } from './onec-encoding'

describe('encode1CBytes', () => {
	it('encodes Cyrillic text as windows-1251, not UTF-8', () => {
		const text = 'СекцияДокумент=Платежное поручение'
		const bytes = encode1CBytes(text)

		// A UTF-8 encoding of the same string would be longer (2 bytes per
		// Cyrillic codepoint) than windows-1251's 1 byte per character.
		expect(bytes.length).toBe(text.length)
		expect(iconv.decode(Buffer.from(bytes), 'win1251')).toBe(text)
	})

	it('round-trips the full 1CClientBankExchange payload losslessly', () => {
		// ASCII + Cyrillic only: windows-1251 has no Romanian diacritics
		// (ă/â/î/ș/ț) — a Romanian description would lose them regardless of
		// which encoder is used, since that's a limitation of the exchange
		// format's codepage itself, not of encode1CBytes.
		const text = [
			'1CClientBankExchange',
			'ВерсияФормата=1.02',
			'Кодировка=Windows',
			'СекцияДокумент=Платежное поручение',
			'НазначениеПлатежа=Oplata postavshiku SC Exemplu SRL, dogovor No. 118',
			'КонецДокумента',
			'КонецФайла'
		].join('\r\n')

		const bytes = encode1CBytes(text)
		expect(iconv.decode(Buffer.from(bytes), 'win1251')).toBe(text)
	})

	it('does not prepend a byte-order mark', () => {
		const bytes = encode1CBytes('1CClientBankExchange')
		// The first 21 bytes must be the literal ASCII signature — no BOM
		// bytes (e.g. UTF-8's EF BB BF) in front of it, since 1C's importer
		// reads the first line as-is to identify the file format.
		const asciiPrefix = Array.from(bytes.slice(0, 21))
			.map(b => String.fromCharCode(b))
			.join('')
		expect(asciiPrefix).toBe('1CClientBankExchange')
	})
})
