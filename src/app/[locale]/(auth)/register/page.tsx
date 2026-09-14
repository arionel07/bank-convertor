'use client'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Link, useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { ROUTES } from '@/lib/routes'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function RegisterPage() {
	const t = useTranslations()
	const router = useRouter()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		const { error } = await authClient.signUp.email({ name, email, password })
		setLoading(false)
		if (error) setError(error.message ?? t('auth.error.generic'))
		else router.push(ROUTES.afterLogin)
	}

	return (
		<Card className="w-full shadow-xl">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl text-center">
					{t('auth.register.title')}
				</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-4">
				<Button
					variant="outline"
					className="w-full h-11"
					onClick={() =>
						authClient.signIn.social({
							provider: 'google',
							callbackURL: ROUTES.afterLogin
						})
					}
				>
					<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
						<path
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
							fill="#4285F4"
						/>
						<path
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							fill="#34A853"
						/>
						<path
							d="M5.84 14.1a7.16 7.16 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
							fill="#FBBC05"
						/>
						<path
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
							fill="#EA4335"
						/>
					</svg>
					{t('auth.google')}
				</Button>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<Separator />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							{t('auth.or')}
						</span>
					</div>
				</div>
				<form onSubmit={onSubmit} className="grid gap-3">
					<div className="grid gap-1.5">
						<Label htmlFor="name">{t('auth.name')}</Label>
						<Input
							id="name"
							type="text"
							required
							autoComplete="name"
							className="h-11 text-base" /* text-base — анти-зум iOS */
							value={name}
							onChange={e => setName(e.target.value)}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="email">{t('auth.email')}</Label>
						<Input
							id="email"
							type="email"
							required
							autoComplete="email"
							className="h-11 text-base" /* text-base — анти-зум iOS */
							value={email}
							onChange={e => setEmail(e.target.value)}
						/>
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="password">{t('auth.password')}</Label>
						<Input
							id="password"
							type="password"
							required
							minLength={8}
							autoComplete="new-password"
							className="h-11 text-base"
							value={password}
							onChange={e => setPassword(e.target.value)}
						/>
					</div>
					{error && (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					)}
					<Button type="submit" className="w-full h-11" disabled={loading}>
						{loading ? '…' : t('auth.register.submit')}
					</Button>
				</form>
			</CardContent>
			<CardFooter className="justify-center">
				<p className="text-sm text-muted-foreground">
					{t('auth.login.hasAccount')}{' '}
					<Link href={ROUTES.login} className="text-primary hover:underline">
						{t('auth.login.title')}
					</Link>
				</p>
			</CardFooter>
		</Card>
	)
}
