import type { Transaction } from '@/lib/parsers/types'
import ExcelJS from 'exceljs'
import { downloadBlob } from './download'

export async function transactionsToXlsxBuffer(
	transactions: Transaction[],
	headers: string[]
): Promise<ArrayBuffer> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Transactions')

	sheet.columns = [
		{ header: headers[0], key: 'date', width: 14 },
		{ header: headers[1], key: 'description', width: 48 },
		{ header: headers[2], key: 'amount', width: 14 },
		{ header: headers[3], key: 'currency', width: 10 },
		{ header: headers[4], key: 'balance', width: 14 }
	]
	sheet.getRow(1).font = { bold: true }
	sheet.views = [{ state: 'frozen', ySplit: 1 }]
	sheet.autoFilter = { from: 'A1', to: 'E1' }

	for (const t of transactions) {
		sheet.addRow({
			date: new Date(t.date),
			description: t.description,
			amount: t.amount,
			currency: t.currency,
			balance: t.balance ?? null
		})
	}

	sheet.getColumn('date').numFmt = 'dd.mm.yyyy'
	sheet.getColumn('amount').numFmt = '#,##0.00'
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
