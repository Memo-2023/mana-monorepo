export const roadmapItems = [
	{
		badge: '✅ Abgeschlossen',
		title: 'Lokale KI-Infrastruktur',
		text: 'LLM (Ollama + Gemma 3), Bilderzeugung (FLUX.2 klein), Spracherkennung (Whisper Large V3) und Sprachsynthese (Piper + Kokoro) laufen vollständig lokal.',
	},
	{
		badge: 'Q2 2026',
		title: 'Cloud-KI eliminieren',
		text: 'Picture App auf lokales mana-image-gen migrieren. Alle LLM-Calls über zentrales mana-llm Gateway routen mit automatischem Google-Fallback.',
	},
	{
		badge: 'Q3 2026',
		title: 'E-Mail-Unabhängigkeit',
		text: 'Brevo SMTP durch self-hosted Postal oder Stalwart ersetzen. DNS bei eigenem europäischen Provider.',
	},
	{
		badge: 'Q4 2026',
		title: 'Landing Pages self-hosted',
		text: 'Statische Seiten direkt vom eigenen Server ausliefern statt über Cloudflare Pages. Nginx/Caddy Container.',
	},
	{
		badge: '2027',
		title: 'Server-Redundanz & 90%+ Unabhängigkeit',
		text: 'Zweiter Server für Hochverfügbarkeit. PostgreSQL Streaming Replication. Kein Single Point of Failure. Ziel: über 90% Self-Hosted.',
	},
];

export const roadmapItemsEn = [
	{
		badge: '✅ Completed',
		title: 'Local AI Infrastructure',
		text: 'LLM (Ollama + Gemma 3), image generation (FLUX.2), speech recognition (Whisper), and text-to-speech (Piper + Kokoro) run fully locally.',
	},
	{
		badge: 'Q2 2026',
		title: 'Eliminate Cloud AI',
		text: 'Migrate Picture App to local mana-image-gen. Route all LLM calls through central mana-llm gateway with automatic Google fallback.',
	},
	{
		badge: 'Q3 2026',
		title: 'Email Independence',
		text: 'Replace Brevo SMTP with self-hosted Postal or Stalwart. DNS with own European provider.',
	},
	{
		badge: 'Q4 2026',
		title: 'Self-Hosted Landing Pages',
		text: 'Serve static sites directly from own server instead of Cloudflare Pages.',
	},
	{
		badge: '2027',
		title: 'Server Redundancy & 90%+ Independence',
		text: 'Second server for high availability. PostgreSQL streaming replication. No single point of failure.',
	},
];
