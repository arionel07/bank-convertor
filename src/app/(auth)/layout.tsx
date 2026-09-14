export default function AuthLayout({
	children
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-dvh grid place-items-center bg-base-200 p-4">
			<div className="w-full max-w-sm">{children}</div>
		</div>
	)
}
