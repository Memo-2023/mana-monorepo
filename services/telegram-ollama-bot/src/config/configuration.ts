export default () => ({
	port: parseInt(process.env.PORT || '3301', 10),
	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN,
		allowedUsers:
			process.env.TELEGRAM_ALLOWED_USERS?.split(',').map((id) => parseInt(id, 10)) || [],
	},
	ollama: {
		url: process.env.OLLAMA_URL || 'http://localhost:11434',
		model: process.env.OLLAMA_MODEL || 'gemma3:4b',
		timeout: parseInt(process.env.OLLAMA_TIMEOUT || '120000', 10),
	},
});

export const SYSTEM_PROMPTS: Record<string, string> = {
	default:
		'Du bist ein hilfreicher Assistent. Antworte präzise und auf Deutsch, wenn der User Deutsch schreibt.',
	classify:
		'Du bist ein Klassifikations-Experte. Analysiere den gegebenen Text und ordne ihn einer passenden Kategorie zu. Antworte kurz und präzise.',
	summarize:
		'Du bist ein Zusammenfassungs-Experte. Fasse den gegebenen Text kurz und prägnant zusammen. Behalte die wichtigsten Informationen bei.',
	translate:
		'Du bist ein Übersetzer. Übersetze den Text in die gewünschte Sprache. Behalte den Ton und Stil bei.',
	code: 'Du bist ein Programmier-Assistent. Hilf bei Code-Fragen, erkläre Konzepte und schlage Verbesserungen vor.',
};
