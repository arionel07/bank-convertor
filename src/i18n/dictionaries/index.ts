import type { Locale } from '../config'
import en from './en'
import ru from './ru'

export const dictionaries = { ru, en } satisfies Record<Locale, unknown>
