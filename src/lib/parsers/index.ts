import { genericParser } from './generic'
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
 */
export const PARSERS: BankParser[] = [
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
