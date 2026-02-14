export default () => ({
	port: parseInt(process.env.PORT || '4020', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	manaAuth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_TEXT = `**Onboarding Bot - Profil einrichten**

**Befehle:**
- \`!start\` - Onboarding starten/neustarten
- \`!profile\` - Dein Profil anzeigen
- \`!edit name Max\` - Namen andern
- \`!edit interests KI, Musik\` - Interessen andern
- \`!edit language de\` - Sprache andern (de/en)
- \`!skip\` - Aktuelle Frage uberspringen
- \`!help\` - Diese Hilfe anzeigen

**Onboarding-Flow:**
1. Anzeigename eingeben
2. Interessen angeben (optional)
3. Sprache wahlen (de/en)
4. Profil bestatigen`;

export const WELCOME_TEXT = `**Willkommen beim Onboarding!**

Ich helfe dir, dein Profil einzurichten. Das dauert nur einen Moment.

Wie mochtest du genannt werden?`;

export const MESSAGES = {
	de: {
		welcome:
			'**Willkommen beim Onboarding!**\n\nIch helfe dir, dein Profil einzurichten. Das dauert nur einen Moment.\n\nWie mochtest du genannt werden?',
		askName: 'Wie mochtest du genannt werden?',
		askInterests:
			'Hallo **{name}**! Was sind deine Interessen?\n(z.B. Programmierung, Musik, Gaming - durch Komma getrennt)\n\nSag `!skip` zum Uberspringen.',
		askLanguage:
			'Welche Sprache bevorzugst du?\n\nAntworte mit `de` fur Deutsch oder `en` fur Englisch.',
		summary:
			'**Dein Profil:**\n- Name: {name}\n- Interessen: {interests}\n- Sprache: {language}\n\nIst das korrekt? (ja/nein)',
		completed:
			'Perfekt! Dein Profil ist eingerichtet. Du kannst es jederzeit mit `!profile` anzeigen oder mit `!edit` andern.',
		cancelled: 'Onboarding abgebrochen. Starte jederzeit neu mit `!start`.',
		profileDisplay:
			'**Dein Profil:**\n- Name: {name}\n- Interessen: {interests}\n- Sprache: {language}',
		noProfile: 'Du hast noch kein Profil eingerichtet. Starte mit `!start`.',
		updated: 'Profil aktualisiert!',
		invalidLanguage: 'Bitte wahle `de` oder `en`.',
		skipNotAllowed: 'Diese Frage kann nicht ubersprungen werden.',
		skipped: 'Ubersprungen.',
		alreadyOnboarded:
			'Du hast das Onboarding bereits abgeschlossen. Nutze `!profile` zum Anzeigen oder `!edit` zum Andern.',
		restartPrompt: 'Mochtest du das Onboarding neu starten? (ja/nein)',
		loginRequired: 'Bitte melde dich zuerst an, um das Onboarding zu starten.',
	},
	en: {
		welcome:
			"**Welcome to Onboarding!**\n\nI'll help you set up your profile. This will only take a moment.\n\nWhat would you like to be called?",
		askName: 'What would you like to be called?',
		askInterests:
			'Hello **{name}**! What are your interests?\n(e.g. Programming, Music, Gaming - separated by commas)\n\nSay `!skip` to skip.',
		askLanguage: 'Which language do you prefer?\n\nReply with `de` for German or `en` for English.',
		summary:
			'**Your Profile:**\n- Name: {name}\n- Interests: {interests}\n- Language: {language}\n\nIs this correct? (yes/no)',
		completed:
			'Perfect! Your profile is set up. You can view it anytime with `!profile` or change it with `!edit`.',
		cancelled: 'Onboarding cancelled. Start again anytime with `!start`.',
		profileDisplay:
			'**Your Profile:**\n- Name: {name}\n- Interests: {interests}\n- Language: {language}',
		noProfile: "You haven't set up a profile yet. Start with `!start`.",
		updated: 'Profile updated!',
		invalidLanguage: 'Please choose `de` or `en`.',
		skipNotAllowed: 'This question cannot be skipped.',
		skipped: 'Skipped.',
		alreadyOnboarded:
			'You have already completed onboarding. Use `!profile` to view or `!edit` to change.',
		restartPrompt: 'Would you like to restart onboarding? (yes/no)',
		loginRequired: 'Please log in first to start onboarding.',
	},
};
