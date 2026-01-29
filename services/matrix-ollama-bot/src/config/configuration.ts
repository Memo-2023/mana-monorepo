export default () => ({
	port: parseInt(process.env.PORT || '3311', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',').filter(Boolean) || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	llm: {
		url: process.env.MANA_LLM_URL || 'http://localhost:3025',
		model: process.env.LLM_MODEL || 'ollama/gemma3:4b',
		timeout: parseInt(process.env.LLM_TIMEOUT || '120000', 10),
	},
});

export const SYSTEM_PROMPTS: Record<string, string> = {
	default: `Du bist ein hilfreicher KI-Assistent. Antworte auf Deutsch, wenn der Nutzer Deutsch schreibt. Halte deine Antworten prägnant und hilfreich.`,
	classify: `Du bist ein Textklassifizierer. Analysiere den gegebenen Text und ordne ihn einer passenden Kategorie zu. Gib nur die Kategorie und eine kurze Begründung an.`,
	summarize: `Du bist ein Zusammenfassungs-Experte. Fasse den gegebenen Text kurz und präzise zusammen. Behalte die wichtigsten Informationen bei.`,
	translate: `Du bist ein Übersetzer. Übersetze den Text in die gewünschte Sprache. Wenn keine Zielsprache angegeben ist, übersetze zwischen Deutsch und Englisch.`,
	code: `Du bist ein Programmier-Assistent. Hilf bei Code-Fragen, erkläre Konzepte und schreibe sauberen, gut dokumentierten Code. Verwende Markdown Code-Blöcke für Code.`,
};
