import { genericParser } from './generic'
import { maibCardParser } from './maib-card'
import { maibParser } from './maib'
import { moldindconbankParser } from './moldindconbank'
import { sberbankParser } from './sberbank'
import { tbankParser } from './tbank'
import type { BankParser } from './types'
import { victoriabankParser } from './victoriabank'
import { vtbParser } from './vtb'

/**
 * Bank-specific parsers only — the generic fallback (./generic.ts) is not
 * in this list, see findParserWithFallback(). Ordered roughly by expected
 * usage: MD banks first (maib being the largest), then RU banks.
 *
 * maibCardParser must come before maibParser: both match on generic
 * "MAIB"/"Moldova Agroindbank" header text, but maibCardParser's match()
 * additionally requires a card-statement-specific marker, so it's the
 * more specific check and has to get first refusal (findParser below
 * takes the first match in this array) — otherwise every card statement
 * would be wrongly claimed by the operational-account parser.
 */
export const PARSERS: BankParser[] = [
	maibCardParser,
	maibParser,
	victoriabankParser,
	moldindconbankParser,
	sberbankParser,
	tbankParser,
	vtbParser
]

export function findParser(text: string): BankParser | null {
	return PARSERS.find(p => p.match(text)) ?? null
}

export function findParserWithFallback(text: string): {
	parser: BankParser
	isFallback: boolean
} {
	const specific = findParser(text)
	if (specific) return { parser: specific, isFallback: false }
	return { parser: genericParser, isFallback: true }
}

export * from './types'
