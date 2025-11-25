import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3003),

  // Database
  DATABASE_URL: Joi.string().uri().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Mana Core Auth
  MANA_SERVICE_URL: Joi.string().uri().required(),
  APP_ID: Joi.string().uuid().required(),
  MANA_SERVICE_KEY: Joi.string().allow('').optional(),

  // Frontend
  FRONTEND_URL: Joi.string().uri().optional(),

  // Short URL
  SHORT_URL_BASE: Joi.string().uri().default('https://ulo.ad'),
});
