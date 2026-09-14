# bank-converter

Конвертер банковских выписок (PDF) в 1С, XLSX и CSV. Создан из saas-template
(bun, drizzle/neon, better-auth, resend outbox, lemonsqueezy).

## Быстрый старт (30 минут)

- [ ] `bun install`
- [ ] Neon: создать проект → скопировать pooled DATABASE_URL →
      `bunx drizzle-kit push`
- [ ] `cp .env.example .env.local` → заполнить
- [ ] Google OAuth: console.cloud.google.com → Credentials → redirect:
      `${BETTER_AUTH_URL}/api/auth/callback/google`
- [ ] Resend: добавить домен, прописать DKIM-записи (проверка займёт время —
      начните сразу)
- [ ] Lemon Squeezy: создать продукт+variant → webhook:
      `${SITE}/api/webhooks/lemonsqueezy` со всеми событиями
- [ ] `bun run dev` → проверить: регистрация, Google login, покупка (test mode),
      письмо из outbox
- [ ] Vercel: импорт репо → env vars → deploy

## Структура

- `src/lib/parsers/` — реестр парсеров банковских выписок (`BankParser`)
- `src/lib/export/` — экспорт в 1CClientBankExchange (win-1251), XLSX, CSV
- `src/i18n/` — next-intl, локали `ro` (default) / `en` / `ru`, роутинг `/[locale]`
- `samples/` — примеры PDF-выписок для калибровки парсеров (не коммитить реальные
  выписки с персональными данными)
