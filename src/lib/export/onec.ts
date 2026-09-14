import type { Transaction } from '@/lib/parsers/types'
import { downloadBlob } from './download'

export type OneCAccountInfo = {
	accountNumber?: string
	accountHolder?: string
	bankName?: string
	bankBic?: string
	periodFrom?: string
	periodTo?: string
}

function toDdMmYyyy(isoDate: string): string {
	const [y, m, d] = isoDate.split('-')
	if (!y || !m || !d) return isoDate
	return `${d}.${m}.${y}`
}

function formatAmount(amount: number): string {
	return Math.abs(amount).toFixed(2)
}

function todayParts() {
	const now = new Date()
	const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`
	const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
	return { date, time }
}

/**
 * Builds a 1CClientBankExchange (СекцияДокумент=Платежное поручение) payload.
 * Field layout follows the standard 1.02 interchange format; requisites we
 * can't recover from a bank statement PDF (INN, BIC, bank name) are left as
 * empty keys rather than omitted, since 1C importers expect every key to be
 * present even when blank.
 */
export function transactionsTo1C(
	transactions: Transaction[],
	account: OneCAccountInfo = {}
): string {
	const { date: createdDate, time: createdTime } = todayParts()
	const dates = transactions.map(t => t.date).sort()
	const periodFrom = account.periodFrom ?? dates[0] ?? createdDate
	const periodTo = account.periodTo ?? dates[dates.length - 1] ?? createdDate

	const lines: string[] = []
	lines.push('1CClientBankExchange')
	lines.push('ВерсияФормата=1.02')
	lines.push('Кодировка=Windows')
	lines.push(`Отправитель=bank-converter`)
	lines.push(`Получатель=1C`)
	lines.push(`ДатаСоздания=${createdDate}`)
	lines.push(`ВремяСоздания=${createdTime}`)
	lines.push(`ДатаНачала=${toDdMmYyyy(periodFrom)}`)
	lines.push(`ДатаКонца=${toDdMmYyyy(periodTo)}`)
	if (account.accountNumber) lines.push(`РасчСчет=${account.accountNumber}`)

	for (const [i, t] of transactions.entries()) {
		const isIncoming = t.amount >= 0
		lines.push('СекцияДокумент=Платежное поручение')
		lines.push(`Номер=${t.documentNumber ?? String(i + 1)}`)
		lines.push(`Дата=${toDdMmYyyy(t.date)}`)
		lines.push(`Сумма=${formatAmount(t.amount)}`)
		lines.push(`ПлательщикСчет=${isIncoming ? (t.counterpartyAccount ?? '') : (account.accountNumber ?? '')}`)
		lines.push(`Плательщик=${isIncoming ? (t.counterparty ?? '') : (account.accountHolder ?? '')}`)
		lines.push('ПлательщикИНН=')
		lines.push(`ПлательщикБанк1=${isIncoming ? '' : (account.bankName ?? '')}`)
		lines.push(`ПлательщикБИК=${isIncoming ? '' : (account.bankBic ?? '')}`)
		lines.push(`ПолучательСчет=${isIncoming ? (account.accountNumber ?? '') : (t.counterpartyAccount ?? '')}`)
		lines.push(`Получатель=${isIncoming ? (account.accountHolder ?? '') : (t.counterparty ?? '')}`)
		lines.push('ПолучательИНН=')
		lines.push(`ПолучательБанк1=${isIncoming ? (account.bankName ?? '') : ''}`)
		lines.push(`ПолучательБИК=${isIncoming ? (account.bankBic ?? '') : ''}`)
		lines.push(`ВидПлатежа=`)
		lines.push(`НазначениеПлатежа=${t.description}`)
		lines.push('КонецДокумента')
	}

	lines.push('КонецФайла')
	return lines.join('\r\n')
}

/**
 * windows-1251 is a single-byte encoding with no browser-safe encoder
 * available client-side (iconv-lite needs Node's Buffer), so the actual
 * transcoding happens server-side in /api/export/onec — this just fetches
 * the already-encoded bytes and triggers the download.
 */
export async function download1C(
	transactions: Transaction[],
	account: OneCAccountInfo,
	filename: string
) {
	const res = await fetch('/api/export/onec', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ transactions, account })
	})
	if (!res.ok) throw new Error('1C export failed')
	downloadBlob(await res.blob(), filename)
}
