// Retention window for user-submitted "file didn't parse" PDFs — see the
// comment on parserFeedback in src/db/schema.ts for why this is the only
// place a statement's content is ever stored server-side. Kept short and
// in one place so the privacy page, the purge cron, and this constant
// can never drift out of sync.
export const FEEDBACK_RETENTION_HOURS = 24

export const FEEDBACK_MAX_COMMENT_LENGTH = 2000
