'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import type { Transaction } from '@/lib/parsers/types'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TransactionsTable({
	transactions,
	onChange
}: {
	transactions: Transaction[]
	onChange: (next: Transaction[]) => void
}) {
	const t = useTranslations('converter.table')

	function updateRow(index: number, patch: Partial<Transaction>) {
		onChange(
			transactions.map((row, i) => (i === index ? { ...row, ...patch } : row))
		)
	}

	function deleteRow(index: number) {
		onChange(transactions.filter((_, i) => i !== index))
	}

	if (transactions.length === 0) {
		return (
			<p className="text-sm text-muted-foreground text-center py-8">
				{t('empty')}
			</p>
		)
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="min-w-32">{t('date')}</TableHead>
					<TableHead className="min-w-56">{t('description')}</TableHead>
					<TableHead className="min-w-28">{t('amount')}</TableHead>
					<TableHead className="min-w-20">{t('currency')}</TableHead>
					<TableHead className="min-w-28">{t('balance')}</TableHead>
					<TableHead className="w-10">
						<span className="sr-only">{t('actions')}</span>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{transactions.map((row, i) => (
					<TableRow key={i}>
						<TableCell>
							<Input
								type="date"
								value={row.date}
								onChange={e => updateRow(i, { date: e.target.value })}
								className="h-9 w-36"
							/>
						</TableCell>
						<TableCell className="whitespace-normal">
							<Input
								value={row.description}
								onChange={e => updateRow(i, { description: e.target.value })}
								className="h-9 min-w-56"
							/>
						</TableCell>
						<TableCell>
							<Input
								type="number"
								step="0.01"
								value={row.amount}
								onChange={e =>
									updateRow(i, { amount: Number(e.target.value) || 0 })
								}
								className="h-9 w-28 text-right"
							/>
						</TableCell>
						<TableCell>
							<Input
								value={row.currency}
								onChange={e => updateRow(i, { currency: e.target.value })}
								className="h-9 w-20 uppercase"
								maxLength={3}
							/>
						</TableCell>
						<TableCell>
							<Input
								type="number"
								step="0.01"
								value={row.balance ?? ''}
								onChange={e =>
									updateRow(i, {
										balance:
											e.target.value === '' ? undefined : Number(e.target.value)
									})
								}
								className="h-9 w-28 text-right"
							/>
						</TableCell>
						<TableCell>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t('deleteRow')}
								onClick={() => deleteRow(i)}
							>
								<Trash2 size={16} className="text-destructive" />
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
