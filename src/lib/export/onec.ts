import type { Transaction } from '@/lib/parsers/types'
import { downloadBlob } from './download'

/**
 * 'win1251' (default): protocol keys and Cyrillic values stay Cyrillic;
 * Romanian-diacritic values are auto-transliterated to ASCII (see
 * transliterateRomanianDiacritics in ./onec-encoding.ts) since windows-1251
 * can't represent those letters at all. 'translit': the same win1251
 * file, but every value is transliterated to ASCII — Cyrillic included
 * (see transliterate in ./transliterate.ts) — for importers that don't
 * handle Cyrillic well. There is no windows-1250 option: that encoding
 * has no Cyrillic glyphs, so it corrupted the format's own field names.
 */
export type OneCEncoding = 'win1251' | 'translit'

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
 *
 * `transformValue` runs ONLY over data values (description, names) — never
 * over the protocol keys ("СекцияДокумент", "Плательщик", ...), which are
 * fixed Cyrillic keywords 1C's importer matches literally regardless of
 * the data's language. It exists so the 'translit' OneCEncoding mode can
 * transliterate just the values to ASCII while leaving those keys intact
 * — see /api/export/onec/route.ts.
 */
export function transactionsTo1C(
	transactions: Transaction[],
	account: OneCAccountInfo = {},
	transformValue: (value: string) => string = value => value
): string {
	const { date: createdDate, time: createdTime } = todayParts()
	const dates = transactions.map(t => t.date).sort()
	const periodFrom = account.periodFrom ?? dates[0] ?? createdDate
	const periodTo = account.periodTo ?? dates[dates.length - 1] ?? createdDate
	const accountHolder = transformValue(account.accountHolder ?? '')
	const bankName = transformValue(account.bankName ?? '')

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
		const counterparty = transformValue(t.counterparty ?? '')
		lines.push('СекцияДокумент=Платежное поручение')
		lines.push(`Номер=${t.documentNumber ?? String(i + 1)}`)
		lines.push(`Дата=${toDdMmYyyy(t.date)}`)
		lines.push(`Сумма=${formatAmount(t.amount)}`)
		// Required by real 1C for a Платежное поручение — without one of
		// these, its importer rejects every document with "Дата исполнения
		// документа не указана", regardless of how complete everything
		// else is. Outgoing gets ДатаСписано, incoming gets ДатаПоступило
		// — never both, since a document is only ever one or the other.
		// The statement gives us a single execution date per transaction,
		// so it's reused here rather than left blank or guessed at.
		lines.push(
			isIncoming
				? `ДатаПоступило=${toDdMmYyyy(t.date)}`
				: `ДатаСписано=${toDdMmYyyy(t.date)}`
		)
		lines.push(`ПлательщикСчет=${isIncoming ? (t.counterpartyAccount ?? '') : (account.accountNumber ?? '')}`)
		lines.push(`Плательщик=${isIncoming ? counterparty : accountHolder}`)
		// Плательщик1/Получатель1 (full legal name) are what real 1C uses to
		// auto-create a counterparty record on import — leaving them blank
		// is what triggers 1C's "counterparty details not specified"
		// warning even when the short Плательщик/Получатель name above is
		// filled in. Only ever set on the counterparty's own side, never
		// on ours (account.accountHolder already has its own dedicated
		// Плательщик/Получатель slot above).
		lines.push(`Плательщик1=${isIncoming ? counterparty : ''}`)
		lines.push('ПлательщикИНН=')
		lines.push(`ПлательщикБанк1=${isIncoming ? '' : bankName}`)
		lines.push(`ПлательщикБИК=${isIncoming ? '' : (account.bankBic ?? '')}`)
		lines.push(`ПолучательСчет=${isIncoming ? (account.accountNumber ?? '') : (t.counterpartyAccount ?? '')}`)
		lines.push(`Получатель=${isIncoming ? accountHolder : counterparty}`)
		lines.push(`Получатель1=${isIncoming ? '' : counterparty}`)
		lines.push('ПолучательИНН=')
		lines.push(`ПолучательБанк1=${isIncoming ? bankName : ''}`)
		lines.push(`ПолучательБИК=${isIncoming ? (account.bankBic ?? '') : ''}`)
		lines.push(`ВидПлатежа=`)
		lines.push(`НазначениеПлатежа=${transformValue(t.description)}`)
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
	filename: string,
	encoding: OneCEncoding = 'win1251'
) {
	const res = await fetch('/api/export/onec', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ transactions, account, encoding })
	})
	if (!res.ok) throw new Error('1C export failed')
	downloadBlob(await res.blob(), filename)
}
