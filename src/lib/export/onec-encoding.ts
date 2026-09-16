import iconv from 'iconv-lite'
import { transliterateRomanianDiacritics } from './transliterate'

/**
 * windows-1251 bytes for a 1CClientBankExchange payload — no BOM (see
 * transactionsTo1C's doc comment in ./onec.ts: 1C's importer keys off the
 * literal "1CClientBankExchange" ASCII signature as the file's first
 * bytes, which a byte-order mark would corrupt).
 *
 * windows-1251 is the ONLY wire encoding — a windows-1250 option existed
 * briefly but was removed: the 1CClientBankExchange format's own field
 * names (СекцияДокумент, Плательщик, ...) are fixed Cyrillic keywords,
 * and windows-1250 has no Cyrillic glyphs at all, so encoding the whole
 * file that way corrupted those keys into '?????' and real 1C refused
 * the file outright.
 *
 * windows-1251 itself has no Romanian-diacritic letters either (ă/â/î/ș/ț
 * and the cedilla look-alikes ş/ţ) — encoding those directly would
 * silently turn them into '?' — so every value is transliterated to
 * plain ASCII first. This runs unconditionally (not just in the
 * 'translit' UI mode, which additionally transliterates Cyrillic — see
 * transformValue in transactionsTo1C): there's no encoding left that can
 * represent those letters, so silently losing them is not an option.
 *
 * Server-only: keep this out of anything imported by a 'use client'
 * component — iconv-lite needs Node's Buffer, which isn't polyfilled in
 * the browser bundle. ./onec.ts stays iconv-free for that reason; only
 * this module and the API route that calls it should import iconv-lite.
 */
export function encode1CBytes(text: string): Uint8Array {
	const normalized = transliterateRomanianDiacritics(text)
	return new Uint8Array(iconv.encode(normalized, 'win1251'))
}
