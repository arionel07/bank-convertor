import type { Transaction } from '@/lib/parsers/types'
import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { transactionsToXlsxBuffer } from './xlsx'

const HEADERS = ['Date', 'Description', 'Debit', 'Credit', 'Currency', 'Balance']

const TRANSACTIONS: Transaction[] = [
	{
		date: '2026-03-01',
		description: 'Achitare marfa',
		amount: -150,
		currency: 'MDL',
		balance: 4520.35
	},
	{
		date: '2026-03-02',
		description: 'Incasare factura',
		amount: 300,
		currency: 'MDL',
		balance: 4820.35
	}
]

async function loadRows(buffer: ArrayBuffer) {
	const workbook = new ExcelJS.Workbook()
	await workbook.xlsx.load(buffer)
	const sheet = workbook.worksheets[0]
	return {
		header: (sheet.getRow(1).values as unknown[]).slice(1),
		debit: sheet.getRow(2).getCell('C').value,
		credit: sheet.getRow(2).getCell('D').value,
		row3Debit: sheet.getRow(3).getCell('C').value,
		row3Credit: sheet.getRow(3).getCell('D').value
	}
}

describe('transactionsToXlsxBuffer', () => {
	it('produces a valid xlsx (zip) buffer', async () => {
		const buffer = await transactionsToXlsxBuffer(TRANSACTIONS, HEADERS)
		const bytes = new Uint8Array(buffer)
		expect(bytes[0]).toBe(0x50) // 'P'
		expect(bytes[1]).toBe(0x4b) // 'K' — PK zip signature
	})

	it('writes the Debit/Credit headers and splits amounts into the right column', async () => {
		const buffer = await transactionsToXlsxBuffer(TRANSACTIONS, HEADERS)
		const rows = await loadRows(buffer)

		expect(rows.header).toEqual(HEADERS)
		// debit: value in Debit (C), Credit (D) blank
		expect(rows.debit).toBe(150)
		expect(rows.credit).toBeNull()
		// credit: value in Credit (D), Debit (C) blank
		expect(rows.row3Debit).toBeNull()
		expect(rows.row3Credit).toBe(300)
	})
})
