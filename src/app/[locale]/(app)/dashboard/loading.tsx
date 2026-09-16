import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors dashboard/page.tsx's 3-card shape so the swap-in doesn't jump —
// shown immediately while its 3 DB queries (subscription, pro status,
// monthly usage) are still in flight.
export default function DashboardLoading() {
	return (
		<div className="grid gap-4 max-w-2xl mx-auto">
			<Card className="shadow-lg">
				<CardHeader className="gap-2">
					<Skeleton className="h-7 w-40" />
					<Skeleton className="h-4 w-56" />
				</CardHeader>
			</Card>
			<Card className="shadow-lg">
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent className="grid gap-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-2 w-full" />
				</CardContent>
			</Card>
			<Card className="shadow-lg">
				<CardHeader>
					<Skeleton className="h-6 w-24" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-11 w-full" />
				</CardContent>
			</Card>
		</div>
	)
}
