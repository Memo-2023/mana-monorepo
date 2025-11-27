import * as Joi from 'joi';

export const validationSchema = Joi.object({
	NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
	PORT: Joi.number().default(8080),
	MANA_SERVICE_URL: Joi.string().required(),
	APP_ID: Joi.string().required(),
	MAERCHENZAUBER_SUPABASE_URL: Joi.string().required(),
	MAERCHENZAUBER_SUPABASE_ANON_KEY: Joi.string().required(),
	MAERCHENZAUBER_AZURE_OPENAI_KEY: Joi.string().required(),
	MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT: Joi.string().optional(),
	MAERCHENZAUBER_GOOGLE_GENAI_API_KEY: Joi.string().optional(),
	GOOGLE_AI_API_KEY: Joi.string().optional(),
	GOOGLE_CLOUD_PROJECT: Joi.string().optional(),
	GOOGLE_CLOUD_LOCATION: Joi.string().optional(),
	MAERCHENZAUBER_REPLICATE_API_KEY: Joi.string().optional(),
	GCS_BUCKET_NAME: Joi.string().default('story-teller-images'),
	CORS_ORIGINS: Joi.string().allow('').default(''),
});
