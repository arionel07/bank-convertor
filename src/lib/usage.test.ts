import { describe, expect, it } from 'vitest'
import { hasActiveProAccess } from './usage'

const NOW = new Date('2026-06-15T00:00:00Z')
const YESTERDAY = new Date('2026-06-14T00:00:00Z')
const TOMORROW = new Date('2026-06-16T00:00:00Z')

describe('hasActiveProAccess', () => {
	it('grants access for an active pro subscription', () => {
		expect(
			hasActiveProAccess(
				[{ plan: 'pro', status: 'active', endsAt: null }],
				NOW
			)
		).toBe(true)
	})

	it('REGRESSION: a cancelled subscription still grants access until endsAt — cancelling must not cut off a period the user already paid for', () => {
		expect(
			hasActiveProAccess(
				[{ plan: 'pro', status: 'cancelled', endsAt: TOMORROW }],
				NOW
			)
		).toBe(true)
	})

	it('denies access once endsAt has passed', () => {
		expect(
			hasActiveProAccess(
				[{ plan: 'pro', status: 'cancelled', endsAt: YESTERDAY }],
				NOW
			)
		).toBe(false)
	})

	it('denies access for a cancelled subscription with no endsAt recorded', () => {
		expect(
			hasActiveProAccess([{ plan: 'pro', status: 'cancelled', endsAt: null }], NOW)
		).toBe(false)
	})

	it('denies access for an expired subscription regardless of endsAt', () => {
		expect(
			hasActiveProAccess(
				[{ plan: 'pro', status: 'expired', endsAt: TOMORROW }],
				NOW
			)
		).toBe(false)
	})

	it('ignores a free-plan row even if marked active', () => {
		expect(
			hasActiveProAccess([{ plan: 'free', status: 'active', endsAt: null }], NOW)
		).toBe(false)
	})

	it('denies access with no subscription rows at all', () => {
		expect(hasActiveProAccess([], NOW)).toBe(false)
	})

	it('grants access if any one of several rows currently qualifies (old expired row plus a fresh active one after resubscribing)', () => {
		expect(
			hasActiveProAccess(
				[
					{ plan: 'pro', status: 'expired', endsAt: YESTERDAY },
					{ plan: 'pro', status: 'active', endsAt: null }
				],
				NOW
			)
		).toBe(true)
	})
})
