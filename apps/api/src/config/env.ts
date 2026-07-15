import { z } from 'zod';

// Fail fast at boot if the environment is misconfigured. Validated once and
// exposed as a typed object through ConfigModule.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  // Canonical web app URL. Used both as the primary CORS origin AND to build
  // absolute links (Stripe redirects, invite emails) — so it must stay a single
  // URL, not a list.
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  // Optional regex (as a string) matched against the request Origin to allow
  // extra origins in CORS beyond WEB_ORIGIN — chiefly Vercel preview
  // deployments, whose hostname changes on every deploy. Empty = only
  // WEB_ORIGIN is allowed. Example:
  //   ^https://kairo-multi-tenant-[a-z0-9-]+-yourteam\.vercel\.app$
  WEB_ORIGIN_PREVIEW_REGEX: z.string().default(''),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(1209600),

  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PRICE_PRO: z.string().default(''),
  STRIPE_PRICE_BUSINESS: z.string().default(''),

  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('kairo-attachments'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  SENTRY_DSN: z.string().default(''),

  // Email. When SMTP_URL is empty we use a console transport (logs the message
  // instead of sending) so local dev needs no mail server.
  SMTP_URL: z.string().default(''),
  MAIL_FROM: z.string().default('Kairo <no-reply@kairo.local>'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
