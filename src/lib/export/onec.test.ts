import type { Transaction } from '@/lib/parsers/types'
import { describe, expect, it } from 'vitest'
import { transactionsTo1C } from './onec'

const DOCUMENT_FIELD_ORDER = [
	'Номер',
	'Дата',
	'Сумма',
	'ПлательщикСчет',
	'Плательщик',
	'ПлательщикИНН',
	'ПлательщикБанк1',
	'ПлательщикБИК',
	'ПолучательСчет',
	'Получатель',
	'ПолучательИНН',
	'ПолучательБанк1',
	'ПолучательБИК',
	'ВидПлатежа',
	'НазначениеПлатежа'
]

const TRANSACTIONS: Transaction[] = [
	{
		date: '2026-03-01',
		description: 'Achitare marfa SC XYZ SRL',
		amount: -150,
		currency: 'MDL',
		balance: 4520.35
	},
	{
		date: '2026-03-02',
		description: 'Incasare factura nr 118',
		amount: 300,
		currency: 'MDL',
		balance: 4820.35,
		counterparty: 'Client ABC SRL',
		counterpartyAccount: 'MD00AG000000000000001'
	}
]

const ACCOUNT = {
	accountNumber: 'MD00AG000000000000002',
	accountHolder: 'TEST SRL',
	bankName: 'Moldova Agroindbank',
	bankBic: 'AGRNMD2X'
}

describe('transactionsTo1C', () => {
	it('starts with the literal 1CClientBankExchange signature', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		expect(text.split('\r\n')[0]).toBe('1CClientBankExchange')
	})

	it('declares format version and Windows encoding in the header', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const header = text.split('СекцияДокумент')[0]
		expect(header).toContain('ВерсияФормата=1.02')
		expect(header).toContain('Кодировка=Windows')
	})

	it('ends with КонецФайла', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const lines = text.split('\r\n')
		expect(lines[lines.length - 1]).toBe('КонецФайла')
	})

	it('emits one СекцияДокумент=Платежное поручение block per transaction, each closed by КонецДокумента', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const sectionOpens = text.match(/СекцияДокумент=Платежное поручение/g)
		const sectionCloses = text.match(/КонецДокумента/g)

		expect(sectionOpens).toHaveLength(TRANSACTIONS.length)
		expect(sectionCloses).toHaveLength(TRANSACTIONS.length)
	})

	it('keeps the standard 1.02 field order inside every document block', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const blocks = text
			.split('СекцияДокумент=Платежное поручение')
			.slice(1)
			.map(block => block.split('КонецДокумента')[0])

		for (const block of blocks) {
			const fieldsInBlock = DOCUMENT_FIELD_ORDER.filter(name =>
				block.includes(`${name}=`)
			)
			expect(fieldsInBlock).toEqual(DOCUMENT_FIELD_ORDER)
		}
	})

	it('routes an outgoing payment to Плательщик=own account, incoming to Получатель=own account', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const blocks = text
			.split('СекцияДокумент=Платежное поручение')
			.slice(1)
			.map(block => block.split('КонецДокумента')[0])

		// negative amount = outgoing: our account is the payer
		expect(blocks[0]).toContain(`Плательщик=${ACCOUNT.accountHolder}`)
		expect(blocks[0]).toContain(`ПлательщикСчет=${ACCOUNT.accountNumber}`)

		// positive amount = incoming: our account is the payee
		expect(blocks[1]).toContain(`Получатель=${ACCOUNT.accountHolder}`)
		expect(blocks[1]).toContain(`ПолучательСчет=${ACCOUNT.accountNumber}`)
		expect(blocks[1]).toContain('Плательщик=Client ABC SRL')
	})

	it('always writes a positive amount regardless of the transaction sign', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		expect(text).toContain('Сумма=150.00')
		expect(text).toContain('Сумма=300.00')
		expect(text).not.toContain('Сумма=-150.00')
	})

	it('does not blow up with no account info and no transactions', () => {
		expect(() => transactionsTo1C([])).not.toThrow()
		const text = transactionsTo1C([])
		expect(text.split('\r\n')[0]).toBe('1CClientBankExchange')
		expect(text.trim().endsWith('КонецФайла')).toBe(true)
	})
})
