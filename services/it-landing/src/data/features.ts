export const problemFeatures = [
	{
		icon: '🛡️',
		title: 'US Cloud Act',
		description:
			'US-Behörden können jederzeit auf Daten zugreifen, die bei amerikanischen Cloud-Anbietern gespeichert sind — selbst wenn die Server in Europa stehen.',
	},
	{
		icon: '🔒',
		title: 'Vendor Lock-in',
		description:
			'Proprietäre Systeme von AWS, Google und Microsoft schaffen Abhängigkeiten, die Millionen kosten und Innovationsfreiheit einschränken.',
	},
	{
		icon: '⚠️',
		title: 'Fehlende Kontrolle',
		description:
			'Bei Cloud-Ausfällen oder Preisänderungen gibt es keinen Plan B. Europäische Organisationen sind den Entscheidungen US-amerikanischer Konzerne ausgeliefert.',
	},
	{
		icon: '⚖️',
		title: 'DSGVO-Konflikte',
		description:
			'Schrems II hat gezeigt: Der Datentransfer in die USA ist rechtlich problematisch. Jedes Unternehmen, das US-Cloud nutzt, trägt ein Compliance-Risiko.',
	},
];

export const gdprFeatures = [
	{
		icon: '✅',
		title: 'Rechtmäßigkeit & Transparenz',
		description:
			'Nur technisch notwendige Cookies. Explizite Einwilligung für alle Datenverarbeitungen. Keine versteckten Datensammlungen.',
	},
	{
		icon: '📉',
		title: 'Datenminimierung',
		description:
			'Nur E-Mail bei Registrierung. Automatische Löschung nach Zweckerfüllung. Anonymisierte Analytics mit self-hosted Umami.',
	},
	{
		icon: '👤',
		title: 'Betroffenenrechte',
		description:
			'Alle 6 Rechte umgesetzt: Auskunft, Berichtigung, Löschung, Übertragbarkeit, Widerspruch, Einschränkung — per Self-Service im Dashboard.',
	},
	{
		icon: '🔐',
		title: 'Technische Sicherheit',
		description:
			'TLS 1.3, AES-256 Verschlüsselung, EdDSA JWT-Authentifizierung, regelmäßige Sicherheitsaudits.',
	},
	{
		icon: '🚨',
		title: '72h Breach Notification',
		description:
			'Automatisierte Erkennung von Datenschutzverletzungen. Sofortige interne Eskalation. Meldung an Aufsichtsbehörde innerhalb von 72 Stunden.',
	},
	{
		icon: '🤖',
		title: 'KI ohne Trainingsrisiko',
		description:
			'Keine Nutzerdaten für KI-Training. Lokale Modelle verarbeiten Daten direkt auf dem Server — nichts verlässt die Infrastruktur.',
	},
];

export const stackFeatures = [
	{ icon: '🗄️', title: 'PostgreSQL 16', description: 'Statt DynamoDB / Firestore' },
	{ icon: '⚡', title: 'Redis 7', description: 'Statt ElastiCache' },
	{ icon: '📦', title: 'MinIO', description: 'Statt AWS S3' },
	{ icon: '🔐', title: 'Better Auth', description: 'Statt Auth0 / Okta' },
	{ icon: '🔍', title: 'SearXNG', description: 'Statt Google / Algolia' },
	{ icon: '💬', title: 'Matrix/Synapse', description: 'Statt Slack / Teams' },
	{ icon: '🤖', title: 'Ollama + Gemma', description: 'Statt OpenAI API' },
	{ icon: '📊', title: 'VictoriaMetrics', description: 'Statt Datadog' },
];

export const principles = [
	{
		icon: 'shield' as const,
		title: 'Daten in Deutschland',
		description:
			'Alle Nutzerdaten verbleiben auf eigenen Servern in Deutschland. Kein Datentransfer in Drittländer. Keine US-Cloud-Abhängigkeit.',
	},
	{
		icon: 'code' as const,
		title: 'Open-Source-Stack',
		description:
			'PostgreSQL, Redis, MinIO, Matrix — unsere Infrastruktur basiert auf bewährten Open-Source-Technologien. Kein proprietäres Lock-in.',
	},
	{
		icon: 'rocket' as const,
		title: 'Lokale KI',
		description:
			'LLM, Bilderzeugung, Spracherkennung und Sprachsynthese laufen lokal auf eigener Hardware. Keine Daten verlassen den Server.',
	},
];
