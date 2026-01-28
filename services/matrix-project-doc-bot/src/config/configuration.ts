export default () => ({
	port: parseInt(process.env.PORT || '3313', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedUsers: process.env.MATRIX_ALLOWED_USERS?.split(',').filter(Boolean) || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	database: {
		url: process.env.DATABASE_URL || '',
	},
	s3: {
		endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
		region: process.env.S3_REGION || 'us-east-1',
		accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
		secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
		bucket: process.env.S3_BUCKET || 'project-doc-bot',
	},
	openai: {
		apiKey: process.env.OPENAI_API_KEY || '',
		model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
		whisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
	},
});

export const BLOG_STYLES: Record<string, { name: string; prompt: string }> = {
	casual: {
		name: 'Casual Blog',
		prompt: `Schreibe einen lockeren, persönlichen Blogbeitrag über dieses Projekt. Nutze eine freundliche, nahbare Sprache. Füge passende Überschriften und Absätze ein.`,
	},
	technical: {
		name: 'Technischer Bericht',
		prompt: `Schreibe einen detaillierten technischen Bericht über dieses Projekt. Fokussiere auf Methoden, Materialien und den Prozess. Sei präzise und informativ.`,
	},
	tutorial: {
		name: 'Schritt-für-Schritt Anleitung',
		prompt: `Erstelle eine Schritt-für-Schritt Anleitung basierend auf diesem Projekt. Nummeriere die Schritte und erkläre jeden ausführlich, sodass andere es nachmachen können.`,
	},
	social: {
		name: 'Social Media Post',
		prompt: `Erstelle einen kurzen, ansprechenden Social Media Post über dieses Projekt. Maximal 280 Zeichen für den Haupttext, plus optionale Hashtags.`,
	},
	story: {
		name: 'Storytelling',
		prompt: `Erzähle die Geschichte dieses Projekts. Beginne mit der Motivation, beschreibe Herausforderungen und ende mit dem Ergebnis. Mach es persönlich und fesselnd.`,
	},
};
