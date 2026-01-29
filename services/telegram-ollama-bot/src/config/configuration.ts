export default () => ({
	port: parseInt(process.env.PORT || '3301', 10),
	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN,
		allowedUsers:
			process.env.TELEGRAM_ALLOWED_USERS?.split(',').map((id) => parseInt(id, 10)) || [],
	},
	llm: {
		url: process.env.MANA_LLM_URL || 'http://localhost:3025',
		model: process.env.LLM_MODEL || 'ollama/gemma3:4b',
		timeout: parseInt(process.env.LLM_TIMEOUT || '120000', 10),
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
