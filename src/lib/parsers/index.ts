import { genericParser } from './generic'
import { maibParser } from './maib'
import type { BankParser } from './types'

/** Bank-specific parsers only — the generic fallback is not in this list. */
export const PARSERS: BankParser[] = [maibParser]

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
