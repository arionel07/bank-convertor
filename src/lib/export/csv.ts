import type { Transaction } from '@/lib/parsers/types'
import { downloadBlob } from './download'

function escapeCsvField(value: string): string {
	if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`
	return value
}

/**
 * `headers` order: [date, description, debit, credit, currency, balance]
 * — see xlsx.ts's comment on why debit/credit are split into separate
 * columns instead of one signed amount.
 */
export function transactionsToCsv(
	transactions: Transaction[],
	headers: string[]
): string {
	const rows = transactions.map(t => [
		t.date,
		t.description,
		t.amount < 0 ? Math.abs(t.amount).toFixed(2) : '',
		t.amount >= 0 ? t.amount.toFixed(2) : '',
		t.currency,
		t.balance !== undefined ? t.balance.toFixed(2) : ''
	])
	return [headers, ...rows]
		.map(row => row.map(field => escapeCsvField(String(field))).join(','))
		.join('\r\n')
}

// Excel only auto-detects UTF-8 (rather than the system codepage) for a
// CSV that starts with a byte-order mark.
const UTF8_BOM = String.fromCharCode(0xfeff)

export function downloadCsv(
	transactions: Transaction[],
	headers: string[],
	filename: string
) {
	const csv = transactionsToCsv(transactions, headers)
	downloadBlob(
		new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8' }),
		filename
	)
}
