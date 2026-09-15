import { Link } from '@/i18n/navigation'
import type { MDXComponents } from 'mdx/types'
import type { ComponentProps } from 'react'

function MdxLink({ href, ...props }: ComponentProps<'a'>) {
	if (href?.startsWith('/')) {
		return <Link href={href} {...props} />
	}
	return <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
}

export const mdxComponents: MDXComponents = {
	h1: props => (
		<h1 className="text-3xl font-bold tracking-tight mt-8 mb-4" {...props} />
	),
	h2: props => (
		<h2
			className="text-2xl font-semibold tracking-tight mt-10 mb-3"
			{...props}
		/>
	),
	h3: props => <h3 className="text-xl font-semibold mt-8 mb-2" {...props} />,
	p: props => <p className="leading-7 mb-4 text-foreground/90" {...props} />,
	ul: props => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
	ol: props => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
	li: props => <li className="leading-7" {...props} />,
	a: MdxLink,
	strong: props => <strong className="font-semibold" {...props} />,
	blockquote: props => (
		<blockquote
			className="border-l-2 border-primary pl-4 italic text-muted-foreground my-4"
			{...props}
		/>
	),
	code: props => (
		<code
			className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
			{...props}
		/>
	),
	hr: props => <hr className="my-8 border-border" {...props} />
}
