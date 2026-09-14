import { maibParser } from './maib'
import type { BankParser } from './types'

export const PARSERS: BankParser[] = [maibParser]

export function findParser(text: string): BankParser | null {
	return PARSERS.find(p => p.match(text)) ?? null
}

export * from './types'
