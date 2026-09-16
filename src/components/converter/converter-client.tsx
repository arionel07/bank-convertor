'use client'
import { Dropzone } from '@/components/converter/dropzone'
import { ReportIssueDialog } from '@/components/converter/report-issue-dialog'
import { TransactionsTable } from '@/components/converter/transactions-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Link } from '@/i18n/navigation'
import { downloadCsv } from '@/lib/export/csv'
import { download1C, type OneCEncoding } from '@/lib/export/onec'
import { downloadXlsx } from '@/lib/export/xlsx'
import type {
	ParseApiError,
	ParseApiResponse,
	ParsedAccount,
	Transaction
} from '@/lib/parsers/types'
import { FileWarning, Flag, RotateCcw, TriangleAlert } from 'lucide-react'
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
	anon_limit_reached: 'limitReached',
	rate_limited: 'rateLimited'
}

// Errors worth offering "report this file" for — i.e. ones that mean the
// parser itself failed on a legitimate PDF, as opposed to the user's own
// file (wrong type / too big) or their plan limit.
const PARSER_QUALITY_ERRORS: ParseApiError[] = ['no_transactions', 'not_implemented']

export function ConverterClient() {
	const t = useTranslations('converter')
	const [status, setStatus] = useState<Status>('idle')
	const [error, setError] = useState<ParseApiError | null>(null)
	const [uploadedFile, setUploadedFile] = useState<File | null>(null)
	const [bankName, setBankName] = useState<string | null>(null)
	const [bankCode, setBankCode] = useState<string | null>(null)
	const [account, setAccount] = useState<ParsedAccount>({})
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [fallbackWarning, setFallbackWarning] = useState(false)
	const [oneCEncoding, setOneCEncoding] = useState<OneCEncoding>('win1251')
	const [exporting, setExporting] = useState<'xlsx' | 'csv' | 'onec' | null>(null)

	async function handleFile(file: File) {
		if (file.type !== 'application/pdf') {
			setStatus('error')
			setError('invalid_type')
			return
		}

		setStatus('uploading')
		setError(null)
		setUploadedFile(file)

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
			setBankCode(data.bankCode)
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
		setUploadedFile(null)
		setBankName(null)
		setBankCode(null)
		setAccount({})
		setTransactions([])
		setFallbackWarning(false)
	}

	// Order matches the XLSX/CSV export columns — see the comment on
	// transactionsToXlsxBuffer in @/lib/export/xlsx.ts.
	const exportHeaders = [
		t('table.date'),
		t('table.description'),
		t('table.debit'),
		t('table.credit'),
		t('table.currency'),
		t('table.balance')
	]

	async function runExport(
		format: 'xlsx' | 'csv' | 'onec',
		action: () => Promise<void> | void
	) {
		setExporting(format)
		try {
			await action()
		} catch {
			toast.error(t('error.generic'))
		} finally {
			setExporting(null)
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

	if (status === 'error' && error === 'anon_limit_reached') {
		return (
			<Card className="max-w-lg mx-auto shadow-lg">
				<CardContent className="pt-6 text-center grid gap-4">
					<FileWarning className="mx-auto text-primary" size={32} />
					<div>
						<h2 className="text-xl font-semibold">{t('anonLimit.title')}</h2>
						<p className="text-muted-foreground mt-1">
							{t('anonLimit.subtitle')}
						</p>
					</div>
					<Button
						nativeButton={false}
						render={<Link href="/register" />}
						className="h-11"
					>
						{t('anonLimit.cta')}
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
					<span className="flex-1">{t(`error.${ERROR_MESSAGE_KEY[error]}`)}</span>
					{PARSER_QUALITY_ERRORS.includes(error) && uploadedFile && (
						<ReportIssueDialog
							file={uploadedFile}
							bankCode={null}
							trigger={
								<Button
									variant="outline"
									size="sm"
									className="shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
								>
									<Flag size={14} />
									{t('report.trigger')}
								</Button>
							}
						/>
					)}
				</div>
			)}

			{status === 'ready' && (
				<div className="grid gap-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-sm text-muted-foreground">
							{bankName && t('detectedBank', { bank: bankName })} ·{' '}
							{t('transactionsFound', { count: transactions.length })}
						</p>
						<div className="flex items-center gap-2">
							<ReportIssueDialog
								file={uploadedFile}
								bankCode={bankCode}
								trigger={
									<Button variant="ghost" size="sm" className="gap-1.5">
										<Flag size={14} />
										{t('report.trigger')}
									</Button>
								}
							/>
							<Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
								<RotateCcw size={14} />
								{t('reset')}
							</Button>
						</div>
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
							disabled={exporting !== null}
							onClick={() =>
								runExport('xlsx', () =>
									downloadXlsx(transactions, exportHeaders, 'statement.xlsx')
								)
							}
						>
							{exporting === 'xlsx' && <Spinner />}
							{t('export.xlsx')}
						</Button>
						<Button
							variant="outline"
							className="h-11"
							disabled={exporting !== null}
							onClick={() =>
								runExport('csv', () =>
									downloadCsv(transactions, exportHeaders, 'statement.csv')
								)
							}
						>
							{exporting === 'csv' && <Spinner />}
							{t('export.csv')}
						</Button>
						<Button
							className="h-11"
							disabled={exporting !== null}
							onClick={() =>
								runExport('onec', () =>
									download1C(
										transactions,
										account,
										'statement_1c.txt',
										oneCEncoding
									)
								)
							}
						>
							{exporting === 'onec' && <Spinner />}
							{t('export.onec')}
						</Button>
						<Select
							value={oneCEncoding}
							onValueChange={value => setOneCEncoding(value as OneCEncoding)}
						>
							<SelectTrigger className="h-11 w-full sm:w-auto">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="win1251">
									{t('encoding.win1251')}
								</SelectItem>
								<SelectItem value="translit">
									{t('encoding.translit')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</div>
	)
}
