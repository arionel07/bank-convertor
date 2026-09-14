import type { Dictionary, DictionaryKey } from './dictionaries/ru'

export type TranslateFn = (
	key: DictionaryKey,
	vars?: Record<string, string | number>
) => string

export function createTranslate(dict: Dictionary): TranslateFn {
	return (key, vars) => {
		let str: string = dict[key] ?? key
		if (vars) {
			for (const [name, value] of Object.entries(vars)) {
				str = str.replaceAll(`{${name}}`, String(value))
			}
		}
		return str
	}
}
