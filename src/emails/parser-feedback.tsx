import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Text
} from '@react-email/components'

export function ParserFeedbackEmail({
	bankCode,
	comment,
	contactEmail,
	fileName,
	downloadUrl,
	expiresInHours
}: {
	bankCode: string | null
	comment: string
	contactEmail: string | null
	fileName: string
	downloadUrl: string
	expiresInHours: number
}) {
	return (
		<Html>
			<Head />
			<Preview>Новый отзыв о нераспознанном файле</Preview>
			<Body style={{ fontFamily: 'sans-serif' }}>
				<Container>
					<Heading>Файл не распознался</Heading>
					<Text>Банк (определён автоматически): {bankCode ?? 'не определён'}</Text>
					<Text>Комментарий пользователя:</Text>
					<Text style={{ whiteSpace: 'pre-wrap' }}>{comment}</Text>
					{contactEmail && <Text>Контакт для ответа: {contactEmail}</Text>}
					<Hr />
					<Text>
						Файл <b>{fileName}</b> доступен по ссылке ниже. Ссылка перестанет
						работать через {expiresInHours} ч. — файл будет безвозвратно
						удалён.
					</Text>
					<Link href={downloadUrl}>{downloadUrl}</Link>
				</Container>
			</Body>
		</Html>
	)
}
