export default () => ({
	port: parseInt(process.env.PORT || '3302', 10),
	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN,
		allowedUsers:
			process.env.TELEGRAM_ALLOWED_USERS?.split(',')
				.map((id) => parseInt(id.trim(), 10))
				.filter((id) => !isNaN(id)) || [],
	},
	database: {
		url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/projectdoc',
	},
	s3: {
		endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
		region: process.env.S3_REGION || 'us-east-1',
		accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
		secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
		bucket: process.env.S3_BUCKET || 'projectdoc-storage',
	},
	openai: {
		apiKey: process.env.OPENAI_API_KEY,
	},
	stt: {
		provider: process.env.STT_PROVIDER || 'local', // 'local' or 'openai'
		localUrl: process.env.STT_LOCAL_URL || 'http://localhost:3020',
		model: process.env.STT_MODEL || 'whisper', // 'whisper' or 'voxtral'
	},
	llm: {
		provider: process.env.LLM_PROVIDER || 'mana-llm',
		manaLlm: {
			url: process.env.MANA_LLM_URL || 'http://localhost:3025',
			model: process.env.LLM_MODEL || 'ollama/gemma3:4b',
		},
	},
});

export const BLOG_STYLES = {
	casual: {
		name: 'Locker & Persönlich',
		prompt:
			'Schreibe einen lockeren, persönlichen Blogbeitrag. Verwende "ich" und erzähle die Geschichte authentisch.',
	},
	formal: {
		name: 'Professionell',
		prompt:
			'Schreibe einen professionellen, sachlichen Blogbeitrag. Verwende eine neutrale Sprache.',
	},
	tutorial: {
		name: 'Anleitung/Tutorial',
		prompt:
			'Schreibe einen anleitenden Blogbeitrag mit klaren Schritten. Nummeriere die Schritte und gib praktische Tipps.',
	},
	diary: {
		name: 'Tagebuch',
		prompt:
			'Schreibe einen Tagebuch-Eintrag mit persönlichen Eindrücken und Gefühlen. Sehr authentisch und emotional.',
	},
};
