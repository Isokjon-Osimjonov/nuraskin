import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TELEGRAM_BOT_TOKEN: z.string().min(1).transform((v) => v.trim()),
  TELEGRAM_BOT_ID: z.string().min(1).transform((v) => v.trim()),
  TELEGRAM_BOT_USERNAME: z.string().min(1).transform((v) => v.trim()),
  PORT: z.coerce.number().default(4000),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
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
