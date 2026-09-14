// better Auth or next Auth.js
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as authSchema from '../db/auth-schema.ts'
import { db } from './db'

export const auth = betterAuth({
	appName: 'app-name',
	baseURL: process.env.BETTER_AUTH_URL!,
	secret: process.env.BETTER_AUTH_SECRET!,
	database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		requireEmailVerification: false // пока Resend не подключён — иначе нельзя зайти
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!
		}
	},
	trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!]
})
