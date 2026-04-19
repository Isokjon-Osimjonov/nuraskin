import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  PORT: z.coerce.number().default(4000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  process.stderr.write(`[env] Invalid environment variables:\n${formatted}\n`);
  process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof EnvSchema>;
