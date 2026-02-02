export interface BotCommand {
	command: string;
	aliases?: string[];
	description: string;
	example?: string;
}

export interface BotInfo {
	id: string;
	name: string;
	matrixUserId: string;
	description: string;
	longDescription?: string;
	icon: string;
	color: string;
	commands: BotCommand[];
	category: 'productivity' | 'ai' | 'media' | 'lifestyle' | 'tools';
	requiresAuth: boolean;
	isGateway?: boolean;
}

export const BOTS: BotInfo[] = [
	// AI & Chat
	{
		id: 'mana-bot',
		name: 'Mana Bot',
		matrixUserId: '@mana-bot:matrix.mana.how',
		description: 'All-in-One Gateway zu allen Mana-Services',
		longDescription:
			'Der zentrale Hub, der alle anderen Bots vereint. Starte Chats, erstelle Bilder, verwalte Aufgaben und mehr - alles in einem Bot.',
		icon: 'Sparkle',
		color: 'from-violet-500 to-purple-600',
		category: 'ai',
		requiresAuth: true,
		isGateway: true,
		commands: [
			{ command: '!help', aliases: ['!hilfe'], description: 'Zeigt alle verfügbaren Befehle' },
			{ command: '!chat', description: 'Startet einen KI-Chat' },
			{ command: '!image', aliases: ['!bild'], description: 'Generiert ein Bild mit KI' },
			{ command: '!todo', description: 'Verwaltet Aufgaben' },
			{ command: '!calendar', aliases: ['!cal'], description: 'Kalender-Operationen' },
		],
	},
	{
		id: 'chat-bot',
		name: 'Chat Bot',
		matrixUserId: '@chat-bot:matrix.mana.how',
		description: 'KI-Assistent powered by Claude und anderen LLMs',
		longDescription:
			'Dein persönlicher KI-Assistent für Fragen, Texterstellung, Zusammenfassungen und kreative Aufgaben. Nutzt verschiedene KI-Modelle.',
		icon: 'ChatCircle',
		color: 'from-blue-500 to-cyan-500',
		category: 'ai',
		requiresAuth: true,
		commands: [
			{
				command: '!chat',
				description: 'Startet eine Konversation',
				example: '!chat Erkläre mir Quantencomputing',
			},
			{ command: '!model', description: 'Wechselt das KI-Modell', example: '!model gpt-4' },
			{ command: '!clear', description: 'Löscht den Chat-Verlauf' },
			{ command: '!system', description: 'Setzt einen System-Prompt' },
		],
	},
	{
		id: 'ollama-bot',
		name: 'Ollama Bot',
		matrixUserId: '@ollama-bot:matrix.mana.how',
		description: 'Lokale KI-Modelle via Ollama',
		longDescription:
			'Chatte mit lokal gehosteten Open-Source KI-Modellen. Vollständig privat, keine Daten verlassen den Server.',
		icon: 'Robot',
		color: 'from-emerald-500 to-teal-600',
		category: 'ai',
		requiresAuth: false,
		commands: [
			{ command: '!ollama', description: 'Startet einen Chat', example: '!ollama Hallo!' },
			{ command: '!models', description: 'Listet verfügbare Modelle' },
			{ command: '!switch', description: 'Wechselt das Modell', example: '!switch llama3' },
		],
	},

	// Productivity
	{
		id: 'todo-bot',
		name: 'Todo Bot',
		matrixUserId: '@todo-bot:matrix.mana.how',
		description: 'Aufgabenverwaltung und To-Do Listen',
		longDescription:
			'Verwalte deine Aufgaben direkt im Chat. Erstelle, bearbeite und erledige Todos mit einfachen Befehlen.',
		icon: 'CheckSquare',
		color: 'from-green-500 to-emerald-600',
		category: 'productivity',
		requiresAuth: true,
		commands: [
			{
				command: '!add',
				description: 'Fügt eine neue Aufgabe hinzu',
				example: '!add Einkaufen gehen',
			},
			{ command: '!list', aliases: ['!todos'], description: 'Zeigt alle Aufgaben' },
			{ command: '!done', description: 'Markiert Aufgabe als erledigt', example: '!done 1' },
			{
				command: '!delete',
				aliases: ['!del'],
				description: 'Löscht eine Aufgabe',
				example: '!delete 1',
			},
			{ command: '!clear', description: 'Löscht alle erledigten Aufgaben' },
		],
	},
	{
		id: 'calendar-bot',
		name: 'Calendar Bot',
		matrixUserId: '@calendar-bot:matrix.mana.how',
		description: 'Terminverwaltung und Erinnerungen',
		longDescription:
			'Plane Termine, setze Erinnerungen und behalte deinen Zeitplan im Blick - alles per Chat-Befehl.',
		icon: 'CalendarBlank',
		color: 'from-orange-500 to-amber-600',
		category: 'productivity',
		requiresAuth: true,
		commands: [
			{
				command: '!event',
				description: 'Erstellt einen Termin',
				example: '!event Meeting morgen 14:00',
			},
			{ command: '!today', description: 'Zeigt heutige Termine' },
			{ command: '!week', description: 'Zeigt Termine dieser Woche' },
			{ command: '!remind', description: 'Setzt eine Erinnerung', example: '!remind 30min Anruf' },
		],
	},
	{
		id: 'contacts-bot',
		name: 'Contacts Bot',
		matrixUserId: '@contacts-bot:matrix.mana.how',
		description: 'Kontaktverwaltung und Adressbuch',
		longDescription:
			'Speichere und finde Kontaktinformationen schnell. Durchsuche dein Adressbuch direkt im Chat.',
		icon: 'AddressBook',
		color: 'from-indigo-500 to-blue-600',
		category: 'productivity',
		requiresAuth: true,
		commands: [
			{ command: '!find', description: 'Sucht nach Kontakten', example: '!find Max Mustermann' },
			{ command: '!add', description: 'Fügt einen Kontakt hinzu' },
			{ command: '!all', description: 'Listet alle Kontakte' },
		],
	},
	{
		id: 'project-doc-bot',
		name: 'Project Doc Bot',
		matrixUserId: '@project-doc-bot:matrix.mana.how',
		description: 'Projektdokumentation und Wissensbasis',
		longDescription:
			'Durchsuche Projektdokumentationen, finde Code-Beispiele und erhalte Antworten basierend auf deiner Wissensbasis.',
		icon: 'Folders',
		color: 'from-purple-500 to-violet-600',
		category: 'productivity',
		requiresAuth: true,
		commands: [
			{
				command: '!search',
				description: 'Durchsucht die Dokumentation',
				example: '!search API authentication',
			},
			{ command: '!projects', description: 'Listet verfügbare Projekte' },
			{ command: '!select', description: 'Wählt ein Projekt aus', example: '!select manacore' },
		],
	},

	// Media
	{
		id: 'picture-bot',
		name: 'Picture Bot',
		matrixUserId: '@picture-bot:matrix.mana.how',
		description: 'KI-Bildgenerierung mit verschiedenen Modellen',
		longDescription:
			'Erstelle beeindruckende Bilder mit KI. Unterstützt verschiedene Stile und Modelle wie Stable Diffusion und DALL-E.',
		icon: 'Image',
		color: 'from-pink-500 to-rose-600',
		category: 'media',
		requiresAuth: true,
		commands: [
			{
				command: '!image',
				aliases: ['!bild'],
				description: 'Generiert ein Bild',
				example: '!image Ein Sonnenuntergang am Meer',
			},
			{ command: '!style', description: 'Wählt einen Stil', example: '!style anime' },
			{ command: '!size', description: 'Setzt die Bildgröße', example: '!size 1024x1024' },
		],
	},
	{
		id: 'tts-bot',
		name: 'TTS Bot',
		matrixUserId: '@tts-bot:matrix.mana.how',
		description: 'Text-to-Speech Sprachausgabe',
		longDescription:
			'Wandle Text in natürlich klingende Sprache um. Unterstützt verschiedene Stimmen und Sprachen.',
		icon: 'SpeakerHigh',
		color: 'from-cyan-500 to-sky-600',
		category: 'media',
		requiresAuth: true,
		commands: [
			{
				command: '!speak',
				aliases: ['!say'],
				description: 'Spricht Text vor',
				example: '!speak Hallo Welt',
			},
			{ command: '!voice', description: 'Wählt eine Stimme', example: '!voice nova' },
			{ command: '!lang', description: 'Setzt die Sprache', example: '!lang de' },
		],
	},
	{
		id: 'storage-bot',
		name: 'Storage Bot',
		matrixUserId: '@storage-bot:matrix.mana.how',
		description: 'Cloud-Speicher und Dateiverwaltung',
		longDescription:
			'Verwalte deine Dateien in der Cloud. Lade hoch, teile und organisiere direkt aus dem Chat.',
		icon: 'CloudArrowUp',
		color: 'from-slate-500 to-zinc-600',
		category: 'media',
		requiresAuth: true,
		commands: [
			{ command: '!upload', description: 'Lädt eine Datei hoch' },
			{ command: '!files', description: 'Listet deine Dateien' },
			{ command: '!share', description: 'Teilt eine Datei', example: '!share document.pdf' },
			{ command: '!delete', description: 'Löscht eine Datei' },
		],
	},

	// Lifestyle
	{
		id: 'nutriphi-bot',
		name: 'NutriPhi Bot',
		matrixUserId: '@nutriphi-bot:matrix.mana.how',
		description: 'Ernährungstracking und Mahlzeiten-Analyse',
		longDescription:
			'Tracke deine Ernährung, analysiere Mahlzeiten per Foto und erhalte Nährwertinformationen.',
		icon: 'ForkKnife',
		color: 'from-lime-500 to-green-600',
		category: 'lifestyle',
		requiresAuth: true,
		commands: [
			{
				command: '!log',
				description: 'Protokolliert eine Mahlzeit',
				example: '!log 2 Äpfel, 1 Sandwich',
			},
			{ command: '!today', description: 'Zeigt heutige Kalorien' },
			{ command: '!analyze', description: 'Analysiert ein Essens-Foto' },
		],
	},
	{
		id: 'planta-bot',
		name: 'Planta Bot',
		matrixUserId: '@planta-bot:matrix.mana.how',
		description: 'Pflanzenidentifikation und Pflege-Tipps',
		longDescription:
			'Identifiziere Pflanzen per Foto und erhalte Pflege-Anleitungen. Perfekt für Hobbygärtner.',
		icon: 'Plant',
		color: 'from-green-600 to-emerald-700',
		category: 'lifestyle',
		requiresAuth: true,
		commands: [
			{ command: '!identify', description: 'Identifiziert eine Pflanze per Foto' },
			{ command: '!care', description: 'Zeigt Pflegetipps', example: '!care Monstera' },
			{ command: '!water', description: 'Erinnerung zum Gießen setzen' },
		],
	},
	{
		id: 'zitare-bot',
		name: 'Zitare Bot',
		matrixUserId: '@zitare-bot:matrix.mana.how',
		description: 'Tägliche Inspiration und Weisheiten',
		longDescription:
			'Erhalte inspirierende Zitate und Weisheiten. Perfekt für den täglichen Motivationsschub.',
		icon: 'Quotes',
		color: 'from-amber-500 to-orange-600',
		category: 'lifestyle',
		requiresAuth: true,
		commands: [
			{ command: '!quote', aliases: ['!zitat'], description: 'Zeigt ein zufälliges Zitat' },
			{ command: '!daily', description: 'Aktiviert tägliche Zitate' },
			{ command: '!topic', description: 'Zitat zu einem Thema', example: '!topic Erfolg' },
		],
	},
	{
		id: 'skilltree-bot',
		name: 'SkillTree Bot',
		matrixUserId: '@skilltree-bot:matrix.mana.how',
		description: 'Fähigkeiten-Tracking und Lernfortschritt',
		longDescription:
			'Verfolge deinen Lernfortschritt, setze Ziele und entwickle deine Fähigkeiten systematisch weiter.',
		icon: 'TreeStructure',
		color: 'from-yellow-500 to-amber-600',
		category: 'lifestyle',
		requiresAuth: true,
		commands: [
			{ command: '!skills', description: 'Zeigt deine Fähigkeiten' },
			{ command: '!add', description: 'Fügt eine Fähigkeit hinzu', example: '!add TypeScript' },
			{
				command: '!progress',
				description: 'Protokolliert Fortschritt',
				example: '!progress TypeScript +2h',
			},
		],
	},

	// Tools
	{
		id: 'clock-bot',
		name: 'Clock Bot',
		matrixUserId: '@clock-bot:matrix.mana.how',
		description: 'Zeiterfassung und Zeitzonen',
		longDescription:
			'Tracke Arbeitszeiten, konvertiere Zeitzonen und setze Timer für Fokus-Sessions.',
		icon: 'Clock',
		color: 'from-blue-600 to-indigo-700',
		category: 'tools',
		requiresAuth: true,
		commands: [
			{ command: '!start', description: 'Startet Zeiterfassung' },
			{ command: '!stop', description: 'Stoppt Zeiterfassung' },
			{ command: '!time', description: 'Zeigt aktuelle Zeit in Zonen', example: '!time NYC' },
			{ command: '!timer', description: 'Setzt einen Timer', example: '!timer 25m Pomodoro' },
		],
	},
	{
		id: 'stats-bot',
		name: 'Stats Bot',
		matrixUserId: '@stats-bot:matrix.mana.how',
		description: 'Nutzungsstatistiken und Analytics',
		longDescription:
			'Erhalte Einblicke in deine Nutzung der Mana-Services. Statistiken, Trends und Zusammenfassungen.',
		icon: 'ChartBar',
		color: 'from-fuchsia-500 to-pink-600',
		category: 'tools',
		requiresAuth: true,
		commands: [
			{ command: '!stats', description: 'Zeigt Nutzungsstatistiken' },
			{ command: '!usage', description: 'Credits-Verbrauch diese Woche' },
			{ command: '!top', description: 'Meistgenutzte Features' },
		],
	},
	{
		id: 'questions-bot',
		name: 'Questions Bot',
		matrixUserId: '@questions-bot:matrix.mana.how',
		description: 'Websuche und Fakten-Recherche',
		longDescription:
			'Durchsuche das Web und erhalte fundierte Antworten mit Quellenangaben. Perfekt für Recherchen.',
		icon: 'MagnifyingGlass',
		color: 'from-teal-500 to-cyan-600',
		category: 'tools',
		requiresAuth: true,
		commands: [
			{
				command: '!search',
				aliases: ['!q'],
				description: 'Sucht im Web',
				example: '!search Wetter Berlin',
			},
			{ command: '!wiki', description: 'Sucht auf Wikipedia', example: '!wiki Photosynthese' },
			{ command: '!news', description: 'Aktuelle Nachrichten' },
		],
	},
	{
		id: 'manadeck-bot',
		name: 'ManaDeck Bot',
		matrixUserId: '@manadeck-bot:matrix.mana.how',
		description: 'Lernkarten und Spaced Repetition',
		longDescription:
			'Erstelle und lerne mit Karteikarten. Nutzt Spaced Repetition für optimales Lernen.',
		icon: 'Cards',
		color: 'from-violet-600 to-purple-700',
		category: 'tools',
		requiresAuth: true,
		commands: [
			{ command: '!learn', description: 'Startet eine Lernsession' },
			{ command: '!add', description: 'Fügt eine Karte hinzu', example: '!add Frage | Antwort' },
			{ command: '!decks', description: 'Listet deine Decks' },
			{ command: '!stats', description: 'Zeigt Lernfortschritt' },
		],
	},
	{
		id: 'presi-bot',
		name: 'Presi Bot',
		matrixUserId: '@presi-bot:matrix.mana.how',
		description: 'Präsentationen erstellen mit KI',
		longDescription:
			'Erstelle professionelle Präsentationen mit KI-Unterstützung. Generiere Folien aus Text oder Themen.',
		icon: 'PresentationChart',
		color: 'from-red-500 to-rose-600',
		category: 'tools',
		requiresAuth: true,
		commands: [
			{
				command: '!create',
				description: 'Erstellt eine Präsentation',
				example: '!create Thema: KI im Alltag',
			},
			{ command: '!slides', description: 'Zeigt deine Präsentationen' },
			{ command: '!export', description: 'Exportiert als PDF/PPTX' },
		],
	},
];

export const CATEGORIES = [
	{ id: 'all', label: 'Alle' },
	{ id: 'productivity', label: 'Produktivität' },
	{ id: 'ai', label: 'KI & Chat' },
	{ id: 'media', label: 'Medien' },
	{ id: 'lifestyle', label: 'Lifestyle' },
	{ id: 'tools', label: 'Tools' },
] as const;

export type BotCategory = (typeof CATEGORIES)[number]['id'];
