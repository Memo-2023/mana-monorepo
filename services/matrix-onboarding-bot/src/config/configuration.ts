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
- \`!edit nickname Max\` - Spitznamen ändern
- \`!edit name Max Mustermann\` - Vollen Namen ändern
- \`!edit birthday 15.03\` - Geburtstag ändern
- \`!edit interests KI, Musik\` - Interessen ändern
- \`!edit goals Produktivität\` - Nutzungsziele ändern
- \`!edit language de\` - Sprache ändern (de/en)
- \`!skip\` - Aktuelle Frage überspringen
- \`!help\` - Diese Hilfe anzeigen

**Onboarding-Flow:**
1. Sprache wählen (de/en)
2. Spitzname eingeben
3. Vollständigen Namen eingeben
4. Geburtstag angeben
5. Interessen eingeben
6. Nutzungsziele angeben
7. Profil bestätigen

Alle Fragen sind optional und können übersprungen werden.`;

export const WELCOME_TEXT = `**Willkommen beim Onboarding!**

Ich helfe dir, dein Profil einzurichten. Das dauert nur einen Moment.
Alle Fragen sind optional - sag einfach \`!skip\` zum Überspringen.

Welche Sprache bevorzugst du? (\`de\` oder \`en\`)`;

export const MESSAGES = {
	de: {
		welcome:
			'**Willkommen beim Onboarding!**\n\nIch helfe dir, dein Profil einzurichten. Das dauert nur einen Moment.\nAlle Fragen sind optional - sag einfach `!skip` zum Überspringen.\n\nWelche Sprache bevorzugst du? (`de` oder `en`)',
		askLanguage:
			'Welche Sprache bevorzugst du?\n\nAntworte mit `de` für Deutsch oder `en` für English.\n\n(Optional - `!skip` zum Überspringen)',
		askNickname:
			'Wie möchtest du genannt werden? (Spitzname)\n\nz.B. Max, Maxi, M...\n\n(Optional - `!skip` zum Überspringen)',
		askFullName:
			'Wie heißt du vollständig? (Vor- und Nachname)\n\n(Optional - `!skip` zum Überspringen)',
		askBirthDate:
			'Wann hast du Geburtstag?\n\nFormat: `TT.MM` oder `TT.MM.JJJJ`\nz.B. `15.03` oder `15.03.1990`\n\n(Optional - `!skip` zum Überspringen)',
		askInterests:
			'Was sind deine Interessen?\n\n(z.B. Programmierung, Musik, Gaming - durch Komma getrennt)\n\n(Optional - `!skip` zum Überspringen)',
		askUsageGoals:
			'Wofür möchtest du Mana nutzen?\n\nz.B. Produktivität, Kreativität, Lernen...\n\n(Optional - `!skip` zum Überspringen)',
		summary:
			'**Dein Profil:**\n- Spitzname: {nickname}\n- Voller Name: {fullName}\n- Geburtstag: {birthDate}\n- Interessen: {interests}\n- Nutzungsziele: {usageGoals}\n- Sprache: {language}\n\nIst das korrekt? (ja/nein)',
		completed:
			'Perfekt! Dein Profil ist eingerichtet.\n\nDu kannst es jederzeit mit `!profile` anzeigen oder mit `!edit` ändern.',
		cancelled: 'Onboarding abgebrochen. Starte jederzeit neu mit `!start`.',
		profileDisplay:
			'**Dein Profil:**\n- Spitzname: {nickname}\n- Voller Name: {fullName}\n- Geburtstag: {birthDate}\n- Interessen: {interests}\n- Nutzungsziele: {usageGoals}\n- Sprache: {language}',
		noProfile: 'Du hast noch kein Profil eingerichtet. Starte mit `!start`.',
		updated: 'Profil aktualisiert!',
		invalidLanguage: 'Bitte wähle `de` oder `en`.',
		invalidBirthDate: 'Bitte gib das Datum im Format `TT.MM` oder `TT.MM.JJJJ` ein.',
		skipped: 'Übersprungen.',
		alreadyOnboarded:
			'Du hast das Onboarding bereits abgeschlossen. Nutze `!profile` zum Anzeigen oder `!edit` zum Ändern.',
		restartPrompt: 'Möchtest du das Onboarding neu starten? (ja/nein)',
		loginRequired: 'Bitte melde dich zuerst an, um das Onboarding zu starten.',
		skipNotAllowed: 'In diesem Schritt ist Überspringen nicht möglich.',
	},
	en: {
		welcome:
			"**Welcome to Onboarding!**\n\nI'll help you set up your profile. This will only take a moment.\nAll questions are optional - just say `!skip` to skip.\n\nWhich language do you prefer? (`de` or `en`)",
		askLanguage:
			'Which language do you prefer?\n\nReply with `de` for German or `en` for English.\n\n(Optional - `!skip` to skip)',
		askNickname:
			'What would you like to be called? (Nickname)\n\ne.g. Max, Maxi, M...\n\n(Optional - `!skip` to skip)',
		askFullName: 'What is your full name? (First and last name)\n\n(Optional - `!skip` to skip)',
		askBirthDate:
			'When is your birthday?\n\nFormat: `DD.MM` or `DD.MM.YYYY`\ne.g. `15.03` or `15.03.1990`\n\n(Optional - `!skip` to skip)',
		askInterests:
			'What are your interests?\n\n(e.g. Programming, Music, Gaming - separated by commas)\n\n(Optional - `!skip` to skip)',
		askUsageGoals:
			'What do you want to use Mana for?\n\ne.g. Productivity, Creativity, Learning...\n\n(Optional - `!skip` to skip)',
		summary:
			'**Your Profile:**\n- Nickname: {nickname}\n- Full Name: {fullName}\n- Birthday: {birthDate}\n- Interests: {interests}\n- Usage Goals: {usageGoals}\n- Language: {language}\n\nIs this correct? (yes/no)',
		completed:
			'Perfect! Your profile is set up.\n\nYou can view it anytime with `!profile` or change it with `!edit`.',
		cancelled: 'Onboarding cancelled. Start again anytime with `!start`.',
		profileDisplay:
			'**Your Profile:**\n- Nickname: {nickname}\n- Full Name: {fullName}\n- Birthday: {birthDate}\n- Interests: {interests}\n- Usage Goals: {usageGoals}\n- Language: {language}',
		noProfile: "You haven't set up a profile yet. Start with `!start`.",
		updated: 'Profile updated!',
		invalidLanguage: 'Please choose `de` or `en`.',
		invalidBirthDate: 'Please enter the date in format `DD.MM` or `DD.MM.YYYY`.',
		skipped: 'Skipped.',
		alreadyOnboarded:
			'You have already completed onboarding. Use `!profile` to view or `!edit` to change.',
		restartPrompt: 'Would you like to restart onboarding? (yes/no)',
		loginRequired: 'Please log in first to start onboarding.',
		skipNotAllowed: 'Skipping is not allowed at this step.',
	},
};
