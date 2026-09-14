import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Preview,
	Text
} from '@react-email/components'

export function WelcomeEmail({ name }: { name: string }) {
	return (
		<Html>
			<Head />
			<Preview>Welcome</Preview>
			<Body style={{ fontFamily: 'sans-serif' }}>
				<Container>
					<Heading>Hi, {name}!</Heading>
					<Text>
						Your account has been created. If you were not, please ignore this
						email.
					</Text>
				</Container>
			</Body>
		</Html>
	)
}
