'use client'
import { Dropzone } from '@/components/converter/dropzone'
import { TransactionsTable } from '@/components/converter/transactions-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Link } from '@/i18n/navigation'
import { downloadCsv } from '@/lib/export/csv'
import { download1C } from '@/lib/export/onec'
import { downloadXlsx } from '@/lib/export/xlsx'
import type {
	ParseApiError,
	ParseApiResponse,
	ParsedAccount,
	Transaction
} from '@/lib/parsers/types'
import { FileWarning, RotateCcw, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

type Status = 'idle' | 'uploading' | 'ready' | 'error'

const ERROR_MESSAGE_KEY: Record<ParseApiError, string> = {
	no_file: 'generic',
	invalid_type: 'invalidType',
	too_large: 'tooLarge',
	no_transactions: 'noTransactions',
	not_implemented: 'generic',
	limit_reached: 'limitReached',
	unauthorized: 'generic'
}

export function ConverterClient() {
	const t = useTranslations('converter')
	const [status, setStatus] = useState<Status>('idle')
	const [error, setError] = useState<ParseApiError | null>(null)
	const [bankName, setBankName] = useState<string | null>(null)
	const [account, setAccount] = useState<ParsedAccount>({})
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [fallbackWarning, setFallbackWarning] = useState(false)

	async function handleFile(file: File) {
		if (file.type !== 'application/pdf') {
			setStatus('error')
			setError('invalid_type')
			return
		}

		setStatus('uploading')
		setError(null)

		try {
			const formData = new FormData()
			formData.append('file', file)
			const res = await fetch('/api/parse', { method: 'POST', body: formData })
			const data: ParseApiResponse = await res.json()

			if (!res.ok || 'error' in data) {
				setStatus('error')
				setError('error' in data ? data.error : 'not_implemented')
				return
			}

			setBankName(data.bankName)
			setAccount(data.account)
			setTransactions(data.transactions)
			setFallbackWarning(data.warning === 'generic_fallback')
			setStatus('ready')
		} catch {
			setStatus('error')
			setError('not_implemented')
		}
	}

	function reset() {
		setStatus('idle')
		setError(null)
		setBankName(null)
		setAccount({})
		setTransactions([])
		setFallbackWarning(false)
	}

	const headers = [
		t('table.date'),
		t('table.description'),
		t('table.amount'),
		t('table.currency'),
		t('table.balance')
	]

	async function withErrorToast(action: () => Promise<void> | void) {
		try {
			await action()
		} catch {
			toast.error(t('error.generic'))
		}
	}

	if (status === 'error' && error === 'limit_reached') {
		return (
			<Card className="max-w-lg mx-auto shadow-lg">
				<CardContent className="pt-6 text-center grid gap-4">
					<FileWarning className="mx-auto text-primary" size={32} />
					<div>
						<h2 className="text-xl font-semibold">{t('upgrade.title')}</h2>
						<p className="text-muted-foreground mt-1">{t('upgrade.subtitle')}</p>
					</div>
					<Button
						nativeButton={false}
						render={<Link href="/price" />}
						className="h-11"
					>
						{t('upgrade.cta')}
					</Button>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="grid gap-6 max-w-4xl mx-auto">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
					{t('title')}
				</h1>
				<p className="text-muted-foreground mt-1">{t('subtitle')}</p>
			</div>

			{status !== 'ready' && (
				<Dropzone onFile={handleFile} disabled={status === 'uploading'} />
			)}

			{status === 'uploading' && (
				<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
					<Spinner />
					{t('parsing')}
				</div>
			)}

			{status === 'error' && error && error !== 'limit_reached' && (
				<div
					role="alert"
					className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					<TriangleAlert size={18} className="shrink-0 mt-0.5" />
					{t(`error.${ERROR_MESSAGE_KEY[error]}`)}
				</div>
			)}

			{status === 'ready' && (
				<div className="grid gap-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-sm text-muted-foreground">
							{bankName && t('detectedBank', { bank: bankName })} ·{' '}
							{t('transactionsFound', { count: transactions.length })}
						</p>
						<Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
							<RotateCcw size={14} />
							{t('reset')}
						</Button>
					</div>

					{fallbackWarning && (
						<div
							role="status"
							className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400"
						>
							<TriangleAlert size={18} className="shrink-0 mt-0.5" />
							{t('warning.genericFallback')}
						</div>
					)}

					<Card className="shadow-lg">
						<CardContent className="p-0 sm:p-2">
							<TransactionsTable
								transactions={transactions}
								onChange={setTransactions}
							/>
						</CardContent>
					</Card>

					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							variant="outline"
							className="h-11"
							onClick={() =>
								withErrorToast(() =>
									downloadXlsx(transactions, headers, 'statement.xlsx')
								)
							}
						>
							{t('export.xlsx')}
						</Button>
						<Button
							variant="outline"
							className="h-11"
							onClick={() =>
								withErrorToast(() =>
									downloadCsv(transactions, headers, 'statement.csv')
								)
							}
						>
							{t('export.csv')}
						</Button>
						<Button
							className="h-11"
							onClick={() =>
								withErrorToast(() =>
									download1C(transactions, account, 'statement_1c.txt')
								)
							}
						>
							{t('export.onec')}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
