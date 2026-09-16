import { describe, expect, it } from 'vitest'
import { checkRateLimit, getClientIp } from './rate-limit'

describe('checkRateLimit', () => {
	it('allows requests up to the limit, then blocks with a Retry-After estimate', () => {
		const key = `test-${Math.random()}`
		for (let i = 0; i < 3; i++) {
			expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
		}
		const blocked = checkRateLimit(key, 3, 60_000)
		expect(blocked.allowed).toBe(false)
		expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
		expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60)
	})

	it('keeps separate buckets per key', () => {
		const keyA = `test-a-${Math.random()}`
		const keyB = `test-b-${Math.random()}`
		expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(true)
		expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(false)
		// a different key isn't affected by keyA's bucket being full
		expect(checkRateLimit(keyB, 1, 60_000).allowed).toBe(true)
	})

	it('allows again once the window has fully elapsed', () => {
		const key = `test-window-${Math.random()}`
		expect(checkRateLimit(key, 1, 10).allowed).toBe(true)
		expect(checkRateLimit(key, 1, 10).allowed).toBe(false)
		return new Promise<void>(resolve => {
			setTimeout(() => {
				expect(checkRateLimit(key, 1, 10).allowed).toBe(true)
				resolve()
			}, 20)
		})
	})
})

describe('getClientIp', () => {
	it('takes the first address from x-forwarded-for', () => {
		const req = new Request('http://localhost', {
			headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }
		})
		expect(getClientIp(req)).toBe('203.0.113.5')
	})

	it('falls back to x-real-ip, then to "unknown"', () => {
		const withRealIp = new Request('http://localhost', {
			headers: { 'x-real-ip': '203.0.113.9' }
		})
		expect(getClientIp(withRealIp)).toBe('203.0.113.9')

		const withNeither = new Request('http://localhost')
		expect(getClientIp(withNeither)).toBe('unknown')
	})
})
