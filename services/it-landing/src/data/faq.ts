export const faqs = [
	{
		question: 'Was bedeutet technologische Souveränität?',
		answer:
			'Die Fähigkeit, Ihre IT-Infrastruktur unabhängig von ausländischen Anbietern zu betreiben und zu kontrollieren. Bei Mana heißt das: 75% unserer Infrastruktur läuft auf eigenen Servern in Deutschland — mit dem Ziel, 90%+ zu erreichen.',
	},
	{
		question: 'Warum ist der US Cloud Act ein Problem?',
		answer:
			'Der US Cloud Act verpflichtet amerikanische Unternehmen, US-Behörden Zugang zu Daten zu gewähren — auch wenn diese auf Servern in Europa gespeichert sind. Das steht im direkten Widerspruch zur DSGVO und gefährdet die Datenhoheit europäischer Organisationen.',
	},
	{
		question: 'Welche Cloud-Abhängigkeiten bleiben bestehen?',
		answer:
			'Nur zwei: Stripe für Zahlungsabwicklung (es gibt keinen vollständig europäischen Payment-Gateway-Ersatz) und Google OAuth für den optionalen Google-Kontakte-Import. Alle anderen Komponenten sind self-hosted oder werden aktiv migriert.',
	},
	{
		question: 'Wie funktioniert die lokale KI?',
		answer:
			'Wir betreiben Ollama mit Modellen wie Gemma 3 auf unserem Server in Deutschland. FLUX.2 generiert Bilder lokal, Whisper transkribiert Sprache, Piper und Kokoro synthetisieren Sprache — alles ohne Cloud-API-Aufrufe. Bei Überlastung gibt es einen optionalen Fallback auf Google Gemini.',
	},
	{
		question: 'Ist der Open-Source-Stack enterprise-tauglich?',
		answer:
			'Absolut. PostgreSQL, Redis und MinIO betreiben die Infrastruktur von Unternehmen wie Apple, Instagram und Netflix. Diese Technologien sind bewährter als viele proprietäre Alternativen.',
	},
	{
		question: 'Kann ich die Mana-Infrastruktur für meine Organisation nutzen?',
		answer:
			'Ja. Wir bieten Beratung und Implementierung für Organisationen, die eine ähnliche unabhängige Infrastruktur aufbauen möchten. Kontaktieren Sie uns für ein individuelles Angebot.',
	},
	{
		question: 'Was kostet der Wechsel weg von US-Cloud-Anbietern?',
		answer:
			'Langfristig sparen Sie. Open-Source-Software hat keine Lizenzkosten. Die Initialinvestition in eigene Server amortisiert sich typischerweise innerhalb von 12-18 Monaten gegenüber Cloud-Abonnements.',
	},
	{
		question: 'Wo stehen die Server?',
		answer:
			'In Deutschland. Die Produktionsinfrastruktur läuft auf eigener Hardware mit 74 Docker-Containern, erreichbar über einen Cloudflare Tunnel (der mittelfristig durch WireGuard ersetzt wird).',
	},
];
