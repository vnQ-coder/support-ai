import { z } from "zod";

/**
 * Schema for environment variables used across the monorepo.
 * All fields are optional to allow running in dev mode without a full env.
 */
export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),

  // Auth (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),

  // AI
  OPENAI_API_KEY: z.string().optional(),

  // Cache
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // General
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate the current process.env against the schema.
 * Returns success/failure with parsed values or error details.
 */
export function validateEnv() {
  return envSchema.safeParse(process.env);
}

/**
 * Returns true if DATABASE_URL is configured (i.e. NOT in dev-mode fallback).
 */
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
