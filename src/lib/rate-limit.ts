// In-memory sliding-window rate limiter — no new external service or env
// var needed, but it comes with real limitations worth knowing before
// relying on it: it resets on every redeploy/restart, and on a
// multi-instance serverless deployment (e.g. several concurrent Vercel
// function instances) each instance keeps its own counters, so the
// *effective* limit is roughly limit × instance count, not a hard cap.
// Good enough to blunt casual abuse and accidental retry storms; if that
// stops being enough, swap this module for Upstash Redis (same API
// shape) without touching the call sites.
const buckets = new Map<string, number[]>()

// Opportunistic cleanup so `buckets` doesn't grow forever as new IPs show
// up — triggered by size rather than a timer, since there's no
// background process to run one in a serverless route handler.
const MAX_TRACKED_KEYS = 5000

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number
): RateLimitResult {
	const now = Date.now()
	const timestamps = (buckets.get(key) ?? []).filter(t => now - t < windowMs)

	if (timestamps.length >= limit) {
		buckets.set(key, timestamps)
		const retryAfterSeconds = Math.ceil(
			(windowMs - (now - timestamps[0])) / 1000
		)
		return { allowed: false, retryAfterSeconds }
	}

	timestamps.push(now)
	buckets.set(key, timestamps)

	if (buckets.size > MAX_TRACKED_KEYS) {
		for (const [k, v] of buckets) {
			if (v.every(t => now - t >= windowMs)) buckets.delete(k)
		}
	}

	return { allowed: true, retryAfterSeconds: 0 }
}

/** Best-effort client IP from the headers a proxy (Vercel, nginx) sets — not spoof-proof, but rate limiting doesn't need to be. */
export function getClientIp(req: Request): string {
	const forwardedFor = req.headers.get('x-forwarded-for')
	if (forwardedFor) return forwardedFor.split(',')[0].trim()
	return req.headers.get('x-real-ip') ?? 'unknown'
}
