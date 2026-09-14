import type { Transaction } from '@/lib/parsers/types'
import { downloadBlob } from './download'

function escapeCsvField(value: string): string {
	if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`
	return value
}

export function transactionsToCsv(
	transactions: Transaction[],
	headers: string[]
): string {
	const rows = transactions.map(t => [
		t.date,
		t.description,
		t.amount.toFixed(2),
		t.currency,
		t.balance !== undefined ? t.balance.toFixed(2) : ''
	])
	return [headers, ...rows]
		.map(row => row.map(field => escapeCsvField(String(field))).join(','))
		.join('\r\n')
}

export function downloadCsv(
	transactions: Transaction[],
	headers: string[],
	filename: string
) {
	const csv = transactionsToCsv(transactions, headers)
	downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
}
