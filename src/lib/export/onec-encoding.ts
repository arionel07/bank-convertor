import iconv from 'iconv-lite'

/**
 * windows-1251 bytes for a 1CClientBankExchange payload — no BOM (see
 * transactionsTo1C's doc comment in ./onec.ts: 1C's importer keys off the
 * literal "1CClientBankExchange" ASCII signature as the file's first
 * bytes, which a byte-order mark would corrupt).
 *
 * Server-only: keep this out of anything imported by a 'use client'
 * component — iconv-lite needs Node's Buffer, which isn't polyfilled in
 * the browser bundle. ./onec.ts stays iconv-free for that reason; only
 * this module and the API route that calls it should import iconv-lite.
 */
export function encode1CBytes(text: string): Uint8Array {
	return new Uint8Array(iconv.encode(text, 'win1251'))
}
