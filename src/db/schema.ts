// import {
// 	boolean,
// 	integer,
// 	pgEnum,
// 	pgTable,
// 	text,
// 	timestamp,
// 	uniqueIndex,
// 	uuid
// } from 'drizzle-orm/pg-core'
import {
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'
export const postStatusEnum = pgEnum('post_status', [
	'pending',
	'reviewing',
	'planned',
	'in_progress',
	'completed',
	'closed'
])

export const errors = pgTable('errors', {
	id: uuid('id').primaryKey().defaultRandom(),
	message: text('message').notNull(),
	stack: text('stack'),
	source: text('source').notNull(), // 'server' | 'client' | 'cron'
	url: text('url'),
	userId: text('user_id'),
	createdAt: timestamp('created_at').notNull().defaultNow()
})

export const emailOutbox = pgTable('email_outbox', {
	id: uuid('id').primaryKey().defaultRandom(),
	to: text('to').notNull(),
	subject: text('subject').notNull(),
	template: text('template').notNull(), // 'welcome' | 'verify' | 'reset'
	payload: jsonb('payload').notNull().default({}),
	status: text('status').notNull().default('pending'), // pending | sent | failed
	attempts: integer('attempts').notNull().default(0),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	sentAt: timestamp('sent_at')
})

// Оплата (Lemon Squeezy)
export const subscriptions = pgTable('subscriptions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	provider: text('provider').notNull().default('lemonsqueezy'),
	customerId: text('customer_id'),
	subscriptionId: text('subscription_id').unique(),
	plan: text('plan').notNull().default('free'),
	status: text('status').notNull().default('active'),
	renewsAt: timestamp('renews_at'),
	endsAt: timestamp('ends_at')
})

// Один ряд = одна успешно распознанная выписка. Месячный лимит бесплатного
// тарифа считается как count(*) по userId за текущий календарный месяц —
// см. src/lib/usage.ts.
export const usage = pgTable('usage', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	bankCode: text('bank_code').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
})

// "Файл не распознался" — юзер сам присылает нам проблемный PDF для
// калибровки парсеров. Это единственное место во всём приложении, где
// содержимое выписки временно оседает на сервере (обычная конвертация в
// src/app/api/parse/route.ts обрабатывает файл только в памяти и никогда
// его не сохраняет) — см. src/lib/feedback.ts и /api/cron/purge-feedback,
// который безвозвратно удаляет строки старше FEEDBACK_RETENTION_HOURS.
// fileBase64 — не bytea: в drizzle-orm/pg-core нет готового bytea-типа
// (PgBinaryVector — это pgvector, не общий бинарник), а заводить свой
// customType под один текстовый столбец избыточно для этого объёма.
export const parserFeedback = pgTable('parser_feedback', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id'),
	bankCode: text('bank_code'),
	comment: text('comment').notNull(),
	contactEmail: text('contact_email'),
	fileName: text('file_name').notNull(),
	fileBase64: text('file_base64').notNull(),
	downloadToken: text('download_token').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
})
