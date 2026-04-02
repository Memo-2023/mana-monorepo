export type InfraStatus = 'self-hosted' | 'replaceable' | 'unavoidable';

export interface InfraComponent {
	name: string;
	technology: string;
	status: InfraStatus;
	icon: string;
}

export const infrastructure: InfraComponent[] = [
	// Self-hosted (green)
	{
		name: 'Datenbank',
		technology: 'PostgreSQL 16 + Drizzle ORM',
		status: 'self-hosted',
		icon: '🗄️',
	},
	{ name: 'Cache', technology: 'Redis 7', status: 'self-hosted', icon: '⚡' },
	{
		name: 'Object Storage',
		technology: 'MinIO (S3-kompatibel)',
		status: 'self-hosted',
		icon: '📦',
	},
	{
		name: 'Authentifizierung',
		technology: 'Better Auth (EdDSA JWT)',
		status: 'self-hosted',
		icon: '🔐',
	},
	{ name: 'Suche', technology: 'SearXNG + mana-search', status: 'self-hosted', icon: '🔍' },
	{ name: 'Messaging', technology: 'Matrix/Synapse + 13 Bots', status: 'self-hosted', icon: '💬' },
	{
		name: 'Monitoring',
		technology: 'VictoriaMetrics + Grafana',
		status: 'self-hosted',
		icon: '📊',
	},
	{ name: 'Analytics', technology: 'Umami', status: 'self-hosted', icon: '📈' },
	{
		name: 'Error Tracking',
		technology: 'GlitchTip (Sentry-kompatibel)',
		status: 'self-hosted',
		icon: '🐛',
	},
	{ name: 'Automation', technology: 'n8n', status: 'self-hosted', icon: '⚙️' },
	{ name: 'LLM / KI-Chat', technology: 'Ollama + Gemma 3', status: 'self-hosted', icon: '🤖' },
	{
		name: 'Spracherkennung',
		technology: 'Whisper Large V3 (mana-stt)',
		status: 'self-hosted',
		icon: '🎤',
	},
	{
		name: 'Sprachsynthese',
		technology: 'Piper + Kokoro (mana-tts)',
		status: 'self-hosted',
		icon: '🔊',
	},
	{
		name: 'Bildgenerierung',
		technology: 'FLUX.2 klein (mana-image-gen)',
		status: 'self-hosted',
		icon: '🎨',
	},

	// Cloud but replaceable (amber)
	{ name: 'E-Mail', technology: 'Brevo SMTP → Postal geplant', status: 'replaceable', icon: '📧' },
	{
		name: 'Landing Pages',
		technology: 'Cloudflare Pages → Self-hosted geplant',
		status: 'replaceable',
		icon: '🌐',
	},
	{
		name: 'Tunnel/DNS',
		technology: 'Cloudflare Tunnel → WireGuard geplant',
		status: 'replaceable',
		icon: '🔗',
	},
	{
		name: 'Bild-API',
		technology: 'Replicate → mana-image-gen Migration',
		status: 'replaceable',
		icon: '🖼️',
	},
	{
		name: 'Vision-KI',
		technology: 'Google Gemini → lokale Modelle testen',
		status: 'replaceable',
		icon: '👁️',
	},

	// Unavoidable cloud (red)
	{
		name: 'Zahlungen',
		technology: 'Stripe (kein EU-Alternative)',
		status: 'unavoidable',
		icon: '💳',
	},
	{
		name: 'Google OAuth',
		technology: 'Für Kontakte-Import nötig',
		status: 'unavoidable',
		icon: '🔑',
	},
];

export const stats = {
	selfHosted: 14,
	replaceable: 5,
	unavoidable: 2,
	total: 21,
	percentSelfHosted: 75,
	targetPercent: 90,
};
