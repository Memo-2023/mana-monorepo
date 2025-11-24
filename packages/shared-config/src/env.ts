/**
 * Environment variable validation utilities
 */

import { z } from 'zod';

/**
 * Common environment variable schemas
 */
export const envSchemas = {
  /** URL schema */
  url: z.string().url(),

  /** Non-empty string schema */
  nonEmpty: z.string().min(1),

  /** Optional string schema */
  optional: z.string().optional(),

  /** Port number schema */
  port: z.coerce.number().int().min(1).max(65535),

  /** Boolean schema (accepts various formats) */
  boolean: z.preprocess(
    (val) => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        return ['true', '1', 'yes', 'on'].includes(val.toLowerCase());
      }
      return false;
    },
    z.boolean()
  ),

  /** Number schema */
  number: z.coerce.number(),

  /** Positive integer schema */
  positiveInt: z.coerce.number().int().positive(),

  /** Email schema */
  email: z.string().email(),

  /** Node environment schema */
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
};

/**
 * Common Supabase environment schema
 */
export const supabaseEnvSchema = z.object({
  SUPABASE_URL: envSchemas.url,
  SUPABASE_ANON_KEY: envSchemas.nonEmpty,
  SUPABASE_SERVICE_ROLE_KEY: envSchemas.nonEmpty.optional(),
});

/**
 * Common app environment schema
 */
export const appEnvSchema = z.object({
  NODE_ENV: envSchemas.nodeEnv,
  PORT: envSchemas.port.default(3000),
});

/**
 * Create an environment config from schema
 */
export function createEnvConfig<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env
): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `  ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Validate environment variables with custom schema
 */
export function validateEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  env: NodeJS.ProcessEnv = process.env
): z.infer<z.ZodObject<T>> {
  return createEnvConfig(schema, env);
}

/**
 * Get required environment variable with type safety
 */
export function getRequiredEnv(key: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[key];

  if (value === undefined || value === '') {
    throw new Error(`Required environment variable "${key}" is not set`);
  }

  return value;
}

/**
 * Get optional environment variable with default
 */
export function getEnv(
  key: string,
  defaultValue: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  return env[key] ?? defaultValue;
}

/**
 * Get boolean environment variable
 */
export function getBoolEnv(
  key: string,
  defaultValue: boolean = false,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const value = env[key];

  if (value === undefined) {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Get number environment variable
 */
export function getNumEnv(
  key: string,
  defaultValue: number,
  env: NodeJS.ProcessEnv = process.env
): number {
  const value = env[key];

  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Check if running in development
 */
export function isDevelopment(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Check if running in test
 */
export function isTest(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'test';
}
