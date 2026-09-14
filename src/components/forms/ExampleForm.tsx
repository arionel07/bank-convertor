'use client'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
	email: z.string().email()
})

export function ExampleForm() {
	const form = useForm({ resolver: zodResolver(schema) })
	return (
		<form
			onSubmit={form.handleSubmit(d => console.log(d))}
			className="grid gap-4"
		>
			<form.Field name="email">
				{field => (
					<Field>
						<FieldLabel htmlFor={field.name}>Email</FieldLabel>
						<Input
							id={field.name}
							value={field.state.value}
							onChange={e => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
						/>
						{field.state.meta.errors.length > 0 && (
							<FieldError errors={field.state.meta.errors} />
						)}
					</Field>
				)}
			</form.Field>
			<Button type="submit" className="h-11">
				Submit
			</Button>
		</form>
	)
}
