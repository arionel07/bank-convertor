import { CtaSection } from '@/components/landing/cta-section'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { LinkButton } from '@/components/ui/link-button'
export default function Home() {
	return (
		<main>
			<LandingHeader />
			{/* <FaqAccordion /> */}
			<section className="px-4 py-20 sm:py-28 text-center">
				<h1 className="text-4xl sm:text-6xl font-bold tracking-tight">title</h1>
				<p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
					subtitle
				</p>
				<div className="mt-8 flex flex-col  sm:flex-row gap-3 justify-center">
					<LinkButton href="/register" className=" rounded-full h-12 px-8">
						register
					</LinkButton>
					<LinkButton
						href="/login"
						variant="outline"
						className=" rounded-full h-12 px-8"
					>
						signin
					</LinkButton>
				</div>
			</section>
			<CtaSection />
			<LandingFooter />
		</main>
	)
}
