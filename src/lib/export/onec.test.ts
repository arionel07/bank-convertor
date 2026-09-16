import type { Transaction } from '@/lib/parsers/types'
import { describe, expect, it } from 'vitest'
import { transactionsTo1C } from './onec'

// ДатаСписано/ДатаПоступило are mutually exclusive — only one appears per
// document, depending on direction — so they're inserted into this base
// order dynamically per block by the field-order test below, rather than
// listed here as if both always appeared.
const DOCUMENT_FIELD_ORDER = [
	'Номер',
	'Дата',
	'Сумма',
	'ПлательщикСчет',
	'Плательщик',
	'Плательщик1',
	'ПлательщикИНН',
	'ПлательщикБанк1',
	'ПлательщикБИК',
	'ПолучательСчет',
	'Получатель',
	'Получатель1',
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

		for (const [i, block] of blocks.entries()) {
			const executionField = TRANSACTIONS[i].amount >= 0 ? 'ДатаПоступило' : 'ДатаСписано'
			const sumIndex = DOCUMENT_FIELD_ORDER.indexOf('Сумма')
			const expectedOrder = [
				...DOCUMENT_FIELD_ORDER.slice(0, sumIndex + 1),
				executionField,
				...DOCUMENT_FIELD_ORDER.slice(sumIndex + 1)
			]

			const fieldsInBlock = expectedOrder.filter(name => block.includes(`${name}=`))
			expect(fieldsInBlock).toEqual(expectedOrder)
		}
	})

	it('REGRESSION: writes ДатаСписано for outgoing documents and ДатаПоступило for incoming ones, right after Сумма — 1C rejects a Платежное поручение with neither ("Дата исполнения документа не указана")', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const blocks = text
			.split('СекцияДокумент=Платежное поручение')
			.slice(1)
			.map(block => block.split('КонецДокумента')[0])

		// TRANSACTIONS[0]: outgoing (-150) -> ДатаСписано only
		expect(blocks[0]).toContain(`Сумма=150.00\r\nДатаСписано=01.03.2026\r\n`)
		expect(blocks[0]).not.toContain('ДатаПоступило=')

		// TRANSACTIONS[1]: incoming (+300) -> ДатаПоступило only
		expect(blocks[1]).toContain(`Сумма=300.00\r\nДатаПоступило=02.03.2026\r\n`)
		expect(blocks[1]).not.toContain('ДатаСписано=')
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

	it('fills Плательщик1/Получатель1 (full counterparty name) on the counterparty\'s own side only — this is what lets 1C auto-create a counterparty record and avoids its "counterparty details not specified" warning', () => {
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT)
		const blocks = text
			.split('СекцияДокумент=Платежное поручение')
			.slice(1)
			.map(block => block.split('КонецДокумента')[0])

		// TRANSACTIONS[0]: outgoing, no counterparty known — both blank
		expect(blocks[0]).toContain('Плательщик1=\r\n')
		expect(blocks[0]).toContain('Получатель1=\r\n')

		// TRANSACTIONS[1]: incoming, counterparty = 'Client ABC SRL' — the
		// counterparty is the payer here, so Плательщик1 gets the name,
		// never Получатель1 (that's our own side, already identified by
		// account.accountHolder elsewhere)
		expect(blocks[1]).toContain('Плательщик1=Client ABC SRL')
		expect(blocks[1]).toContain('Получатель1=\r\n')
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

	it('transformValue changes data values but never the protocol keys', () => {
		const shout = (v: string) => v.toUpperCase()
		const text = transactionsTo1C(TRANSACTIONS, ACCOUNT, shout)

		// keys are literal string constants in the template, never passed
		// through transformValue — they must survive verbatim
		expect(text).toContain('СекцияДокумент=Платежное поручение')
		expect(text).toContain('НазначениеПлатежа=')
		// but the values next to those same keys did get transformed
		expect(text).toContain('НазначениеПлатежа=ACHITARE MARFA SC XYZ SRL')
		expect(text).toContain('ПлательщикИНН=')
	})
})
