import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),

  // Mana Core Required
  MANA_SERVICE_URL: Joi.string().required(),
  APP_ID: Joi.string().uuid().required(),
  MANA_SUPABASE_SECRET_KEY: Joi.string().optional(),
  SIGNUP_REDIRECT_URL: Joi.string().uri().optional(),

  // Your app's database
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_KEY: Joi.string().required(), // Required for edge functions

  // JWT
  JWT_SECRET: Joi.string().optional(),

  // CORS
  FRONTEND_URL: Joi.string().uri().optional(),
});