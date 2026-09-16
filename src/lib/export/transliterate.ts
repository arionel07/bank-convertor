// Cyrillic -> Latin, close to the common GOST/passport-style mapping
// (not phonetically perfect, just readable and lossless enough for a
// payment description). Keys cover both cases; multi-char Latin outputs
// (zh, kh, ts, ch, sh, shch, yu, ya, ye, yo) are intentional.
const CYRILLIC_TO_LATIN: Record<string, string> = {
	а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
	и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
	с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
	щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
	А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E', Ж: 'Zh', З: 'Z',
	И: 'I', Й: 'I', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
	С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'Kh', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh',
	Щ: 'Shch', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya'
}

// Romanian diacritics -> plain Latin. Covers both the cedilla forms
// (ş/ţ) and the comma-below forms (ș/ț) some fonts/keyboards produce
// for the same letters.
const ROMANIAN_TO_LATIN: Record<string, string> = {
	ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't',
	Ă: 'A', Â: 'A', Î: 'I', Ș: 'S', Ş: 'S', Ț: 'T', Ţ: 'T'
}

const TRANSLITERATION_MAP: Record<string, string> = {
	...CYRILLIC_TO_LATIN,
	...ROMANIAN_TO_LATIN
}

const TRANSLITERATABLE_RE = new RegExp(
	`[${Object.keys(TRANSLITERATION_MAP).join('')}]`,
	'g'
)
const ROMANIAN_DIACRITIC_RE = new RegExp(
	`[${Object.keys(ROMANIAN_TO_LATIN).join('')}]`,
	'g'
)

/** Converts Cyrillic and Romanian-diacritic characters to plain ASCII Latin. Anything else (including plain ASCII) passes through unchanged. */
export function transliterate(text: string): string {
	return text.replace(TRANSLITERATABLE_RE, char => TRANSLITERATION_MAP[char])
}

/**
 * Converts only the Romanian-diacritic letters (ă/â/î/ș/ț and the cedilla
 * look-alikes ş/ţ) to plain ASCII, leaving Cyrillic untouched. windows-1251
 * (see ./onec-encoding.ts) has no code points for these Latin letters at
 * all — encoding them directly would silently turn them into '?' — but it
 * *does* support Cyrillic natively, so this narrower pass is what runs
 * unconditionally before every win1251 encode, as opposed to the full
 * `transliterate` above which is only for the explicit 'translit' mode
 * that also strips Cyrillic to ASCII.
 */
export function transliterateRomanianDiacritics(text: string): string {
	return text.replace(ROMANIAN_DIACRITIC_RE, char => ROMANIAN_TO_LATIN[char])
}
