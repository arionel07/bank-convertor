'use client'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { useTranslations } from 'next-intl'

export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
	const t = useTranslations('landing')
	return (
		<section className="px-4 py-12 sm:py-16 max-w-2xl mx-auto w-full">
			<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-6">
				{t('faq.title')}
			</h2>
			<Accordion className="w-full">
				{items.map((item, i) => (
					<AccordionItem key={i} value={`item-${i}`}>
						<AccordionTrigger className="min-h-12 text-left">
							{item.q}
						</AccordionTrigger>
						<AccordionContent className="text-muted-foreground">
							{item.a}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	)
}
