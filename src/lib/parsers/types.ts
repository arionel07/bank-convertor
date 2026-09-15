export type Transaction = {
	/** ISO date, yyyy-mm-dd */
	date: string
	description: string
	/** Signed amount: negative = debit/outgoing, positive = credit/incoming */
	amount: number
	currency: string
	balance?: number
	counterparty?: string
	counterpartyAccount?: string
	documentNumber?: string
}

export interface BankParser {
	bankCode: string
	bankName: string
	/** Cheap heuristic check on the extracted PDF text before running parse() */
	match(text: string): boolean
	parse(text: string): Transaction[]
}

export type ParsedAccount = {
	accountNumber?: string
	accountHolder?: string
	bankName?: string
	bankBic?: string
	periodFrom?: string
	periodTo?: string
}

export type ParseWarning = 'generic_fallback'

export type ParseApiResponse =
	| {
			bankCode: string
			bankName: string
			account: ParsedAccount
			transactions: Transaction[]
			warning?: ParseWarning
	  }
	| { error: ParseApiError }

export type ParseApiError =
	| 'no_file'
	| 'invalid_type'
	| 'too_large'
	| 'no_transactions'
	| 'not_implemented'
	/** Logged-in free user used their FREE_MONTHLY_LIMIT statements this month. */
	| 'limit_reached'
	/** Anonymous visitor already used their one no-account conversion. */
	| 'anon_limit_reached'
