import type { Transaction } from '@/lib/parsers/types'
import ExcelJS from 'exceljs'
import { downloadBlob } from './download'

/**
 * `headers` order: [date, description, debit, credit, currency, balance].
 * Debit/credit are split into separate columns (matching how the source
 * statement itself lays them out) rather than one signed amount column —
 * a debit shows in the Debit column as a positive number, a credit in
 * the Credit column, the other cell left blank.
 */
export async function transactionsToXlsxBuffer(
	transactions: Transaction[],
	headers: string[]
): Promise<ArrayBuffer> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Transactions')

	sheet.columns = [
		{ header: headers[0], key: 'date', width: 14 },
		{ header: headers[1], key: 'description', width: 48 },
		{ header: headers[2], key: 'debit', width: 14 },
		{ header: headers[3], key: 'credit', width: 14 },
		{ header: headers[4], key: 'currency', width: 10 },
		{ header: headers[5], key: 'balance', width: 14 }
	]
	sheet.getRow(1).font = { bold: true }
	sheet.views = [{ state: 'frozen', ySplit: 1 }]
	sheet.autoFilter = { from: 'A1', to: 'F1' }

	for (const t of transactions) {
		sheet.addRow({
			date: new Date(t.date),
			description: t.description,
			debit: t.amount < 0 ? Math.abs(t.amount) : null,
			credit: t.amount >= 0 ? t.amount : null,
			currency: t.currency,
			balance: t.balance ?? null
		})
	}

	sheet.getColumn('date').numFmt = 'dd.mm.yyyy'
	sheet.getColumn('debit').numFmt = '#,##0.00'
	sheet.getColumn('credit').numFmt = '#,##0.00'
	sheet.getColumn('balance').numFmt = '#,##0.00'

	return workbook.xlsx.writeBuffer()
}

export async function downloadXlsx(
	transactions: Transaction[],
	headers: string[],
	filename: string
) {
	const buffer = await transactionsToXlsxBuffer(transactions, headers)
	downloadBlob(
		new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		}),
		filename
	)
}
