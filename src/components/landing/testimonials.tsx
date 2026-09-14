'use client'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useI18n } from '@/i18n/context'

type Testimonial = { name: string; role: string; text: string }

export function Testimonials({ items }: { items: Testimonial[] }) {
	const { t } = useI18n()
	return (
		<section className="px-4 py-12 sm:py-16 max-w-5xl mx-auto w-full">
			<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-8">
				{t('landing.testimonials.title')}
			</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{items.map(item => (
					<Card key={item.name} className="shadow">
						<CardContent className="pt-6">
							<blockquote className="text-sm text-muted-foreground">
								«{item.text}»
							</blockquote>
						</CardContent>
						<CardFooter className="flex-col items-start gap-0.5">
							<p className="font-medium text-sm">{item.name}</p>
							<p className="text-xs text-muted-foreground">{item.role}</p>
						</CardFooter>
					</Card>
				))}
			</div>
		</section>
	)
}
