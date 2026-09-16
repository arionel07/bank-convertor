import { defineConfig, globalIgnores } from 'eslint/config'
import nextTypescript from 'eslint-config-next/typescript'
import nextVitals from 'eslint-config-next/core-web-vitals'

// `next lint` was removed in Next.js 16 — this is the plain `eslint` CLI
// setup from the current docs (flat config), not the old `.eslintrc`
// approach eslint-config-next examples used to show.
const eslintConfig = defineConfig([
	...nextVitals,
	...nextTypescript,
	globalIgnores([
		'.next/**',
		'out/**',
		'build/**',
		'next-env.d.ts',
		'src/lib/parsers/fixtures/**'
	])
])

export default eslintConfig
