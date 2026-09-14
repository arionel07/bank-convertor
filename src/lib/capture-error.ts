import { errors } from '@/db/schema'
import { db } from '@/lib/db'

export async function captureError(
	e: unknown,
	meta?: { source?: string; url?: string; userId?: string }
) {
	const err = e instanceof Error ? e : new Error(String(e))
	await db
		.insert(errors)
		.values({
			message: err.message.slice(0, 500),
			stack: err.stack?.slice(0, 4000),
			source: meta?.source ?? 'server',
			url: meta?.url,
			userId: meta?.userId
		})
		.catch(() => {}) // capture не должен ронять основной код
}
