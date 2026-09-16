import type { Transaction } from '@/lib/parsers/types'
import { describe, expect, it } from 'vitest'
import { transactionsToCsv } from './csv'

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

describe('transactionsToCsv', () => {
	it('splits a debit into the Debit column with Credit left blank', () => {
		const csv = transactionsToCsv(TRANSACTIONS, HEADERS)
		const rows = csv.split('\r\n')

		expect(rows[0]).toBe(HEADERS.join(','))
		expect(rows[1]).toBe('2026-03-01,Achitare marfa,150.00,,MDL,4520.35')
	})

	it('splits a credit into the Credit column with Debit left blank', () => {
		const csv = transactionsToCsv(TRANSACTIONS, HEADERS)
		const rows = csv.split('\r\n')

		expect(rows[2]).toBe('2026-03-02,Incasare factura,,300.00,MDL,4820.35')
	})
})
