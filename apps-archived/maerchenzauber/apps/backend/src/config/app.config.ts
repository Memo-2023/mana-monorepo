import { registerAs } from '@nestjs/config';

export interface AppConfig {
	nodeEnv: string;
	port: number;
	manaServiceUrl: string;
	appId: string;
	corsOrigins: string[];
	supabase: {
		url: string;
		anonKey: string;
	};
	google: {
		genAiApiKey?: string;
		cloudProjectId?: string;
		cloudLocation?: string;
	};
	replicate: {
		apiToken?: string;
	};
	azure: {
		openAiKey: string;
		openAiEndpoint: string;
	};
}

export default registerAs(
	'app',
	(): AppConfig => ({
		nodeEnv: process.env.NODE_ENV || 'development',
		port: parseInt(process.env.PORT || '8080', 10),
		manaServiceUrl:
			process.env.MANA_SERVICE_URL ||
			'https://mana-core-middleware-111768794939.europe-west3.run.app',
		appId: process.env.APP_ID || '8d2f5ddb-e251-4b3b-8802-84022a7ac77f',
		corsOrigins: process.env.CORS_ORIGINS
			? process.env.CORS_ORIGINS.split(',').filter(Boolean)
			: [
					'http://localhost:3000',
					'http://localhost:8081',
					'http://localhost:8082',
					'http://localhost:4200',
					'http://localhost:5173',
					// Landing page domains for universal links
					'https://xn--mrchen-zauber-bfb.de',
					'https://märchen-zauber.de',
				],
		supabase: {
			url: process.env.MAERCHENZAUBER_SUPABASE_URL || '',
			anonKey: process.env.MAERCHENZAUBER_SUPABASE_ANON_KEY || '',
		},
		google: {
			genAiApiKey: process.env.MAERCHENZAUBER_GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY,
			cloudProjectId: process.env.GOOGLE_CLOUD_PROJECT || 'storyteller-a1fde',
			cloudLocation: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
		},
		replicate: {
			apiToken: process.env.MAERCHENZAUBER_REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN,
		},
		azure: {
			openAiKey: process.env.MAERCHENZAUBER_AZURE_OPENAI_KEY || '',
			openAiEndpoint:
				process.env.MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT ||
				'https://storyteller-openai-swedencentral.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview',
		},
	})
);
