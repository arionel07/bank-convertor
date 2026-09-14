import { routing } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { ROUTES } from '@/lib/routes'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
export async function GET(req: Request) {
	const { searchParams } = new URL(req.url)
	const locale = routing.locales.includes(
		searchParams.get('locale') as (typeof routing.locales)[number]
	)
		? searchParams.get('locale')
		: routing.defaultLocale

	const session = await auth.api.getSession({ headers: await headers() })
	if (!session)
		return NextResponse.redirect(
			new URL(`/${locale}${ROUTES.login}`, req.url)
		)

	const plan = searchParams.get('plan')
	if (plan !== 'pro')
		return NextResponse.json({ error: 'unknown plan' }, { status: 400 })

	const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
			'Content-Type': 'application/vnd.api+json',
			Accept: 'application/vnd.api+json'
		},
		body: JSON.stringify({
			data: {
				type: 'checkouts',
				attributes: {
					checkout_data: {
						email: session.user.email,
						custom: { user_id: session.user.id }
					}
				},
				relationships: {
					store: {
						data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID }
					},
					variant: {
						data: {
							type: 'variants',
							id: process.env.LEMONSQUEEZY_PRO_VARIANT_ID
						}
					}
				}
			}
		})
	})

	const json = await res.json()
	const url = json?.data?.attributes?.url
	if (!url)
		return NextResponse.json({ error: 'checkout failed' }, { status: 502 })
	return NextResponse.redirect(url)
}
