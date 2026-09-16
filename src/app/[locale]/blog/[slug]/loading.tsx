import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Skeleton } from '@/components/ui/skeleton'

// compileMDX (page.tsx) runs per-request, so this covers that gap instead
// of leaving the screen blank while it compiles.
export default function BlogPostLoading() {
	return (
		<main>
			<LandingHeader />
			<article className="px-4 py-12 sm:py-16 max-w-2xl mx-auto">
				<Skeleton className="h-4 w-24 mb-6" />
				<Skeleton className="h-4 w-28 mb-2" />
				<Skeleton className="h-9 w-full mb-2" />
				<Skeleton className="h-9 w-3/4 mb-8" />
				<div className="grid gap-3">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			</article>
			<LandingFooter />
		</main>
	)
}
