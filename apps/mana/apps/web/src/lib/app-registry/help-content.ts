/**
 * Per-module help content — description, features, tips.
 *
 * Rendered inline in the page-body when the user clicks the help (?)
 * icon in the PageShell header. Keyed by appId.
 */

export interface ModuleHelp {
	description: string;
	features?: string[];
	tips?: string[];
}

export const MODULE_HELP: Record<string, ModuleHelp> = {
	todo: {
		description:
			'Aufgaben verwalten mit Projekten, Prioritäten und Fälligkeitsdaten. Alles lokal gespeichert und Ende-zu-Ende verschlüsselt.',
		features: [
			'Projekte & Labels zur Organisation',
			'Prioritäten (niedrig / mittel / hoch / dringend)',
			'Fälligkeitsdaten mit Kalender-Integration',
			'Board-Ansicht (Kanban) pro Projekt',
			'Subtasks innerhalb einer Aufgabe',
			'Drag & Drop: Aufgaben in Kalender oder Notizen ziehen',
			'AI-Tools: Aufgaben erstellen, abhaken, auflisten',
		],
		tips: [
			'Ziehe eine Aufgabe auf den Kalender um einen Zeitblock zu erstellen',
			'Im Chat kannst du sagen "erstelle eine Aufgabe: Einkaufen morgen"',
			'Klicke auf ein Projekt um nur dessen Aufgaben zu sehen',
		],
	},
	calendar: {
		description:
			'Termine und Zeitblöcke planen. Verknüpft sich mit Aufgaben, Habits und sozialen Events.',
		features: [
			'Tages-, Wochen- und Monatsansicht',
			'Wiederkehrende Termine',
			'Zeitblöcke für fokussiertes Arbeiten',
			'Verknüpfung mit Todo, Habits & Events',
			'AI-Tools: Termine erstellen, heutige Termine abfragen',
		],
		tips: [
			'Ziehe einen Kontakt auf den Kalender um ein Treffen zu planen',
			'Zeitblöcke verbinden Kalender, Aufgaben und Habits',
		],
	},
	contacts: {
		description:
			'Persönliches Adressbuch. Alle Felder (Name, Adresse, Telefon) sind verschlüsselt gespeichert.',
		features: [
			'Name, E-Mail, Telefon, Adresse, Social-Media',
			'Geburtstage',
			'Verknüpfung mit Events, Aufgaben & Notizen',
			'Drag & Drop in andere Module',
			'AI-Tools: Kontakte erstellen und durchsuchen',
		],
		tips: [
			'Ziehe einen Kontakt auf Todo um eine "Kontaktieren"-Aufgabe zu erstellen',
			'Kontakte tauchen als Verknüpfung in Events und Journal auf',
		],
	},
	habits: {
		description:
			'Gewohnheiten aufbauen und tracken. Tägliche Streaks, farbige Kategorien und Kalender-Integration.',
		features: [
			'Tägliches Logging per Tap',
			'Streak-Tracking mit Tageszielen',
			'Zeitblock-Verknüpfung im Kalender',
			'Farbige Kategorien',
			'Archivieren statt Löschen',
			'AI-Tools: Habits erstellen, loggen, Status abfragen',
		],
		tips: [
			'Habits erscheinen als Zeitblöcke im Kalender wenn du sie loggst',
			'Im Chat: "Logge Meditation für heute"',
		],
	},
	notes: {
		description:
			'Notizen mit Rich-Text-Editor. Titel und Inhalt sind verschlüsselt, Tags helfen bei der Organisation.',
		features: [
			'Rich-Text-Editor mit Markdown-Support',
			'Tags & Farbkodierung',
			'Anheften, Archivieren, Favorisieren',
			'Volltextsuche',
			'AI-Tools: Notizen erstellen, bearbeiten, taggen, durchsuchen',
		],
		tips: [
			'Ziehe eine Aufgabe auf Notizen um eine verknüpfte Notiz zu erstellen',
			'Im Chat: "Erstelle eine Notiz zu meinem Meeting"',
			'Farbige Notizen helfen bei der visuellen Organisation',
		],
	},
	journal: {
		description: 'Tagebuch für tägliche Reflexionen. Stimmung, freier Text — alles verschlüsselt.',
		features: [
			'Tägliche Einträge mit Stimmungswahl',
			'Anheften & Favorisieren',
			'Verschlüsselter Inhalt',
			'AI-Tool: Journal-Einträge erstellen',
		],
		tips: [
			'Im Chat: "Schreibe einen Journal-Eintrag über meinen Tag"',
			'Nutze Anheften für besonders wichtige Einträge',
		],
	},
	dreams: {
		description:
			'Traumtagebuch mit Symbolen, Stimmungen und AI-Interpretation. Finde Muster in deinen Träumen.',
		features: [
			'Traumdatum, Stimmung & Klarheitsgrad',
			'Luzides Träumen markieren',
			'Traumsymbole sammeln & zählen',
			'Tags & Volltextsuche',
			'AI-Interpretation (optional)',
		],
		tips: [
			'Schreibe Träume direkt nach dem Aufwachen auf — die Details verblassen schnell',
			'Wiederkehrende Symbole können auf Muster hinweisen',
		],
	},
	period: {
		description:
			'Zyklustracking mit Tagesprotokoll, Symptomen und Vorhersagen. Gesundheitsdaten sind besonders geschützt (DSGVO Art. 9).',
		features: [
			'Zykluslänge berechnen & nächsten Zyklus vorhersagen',
			'Tägliches Protokoll (Stärke, Stimmung, Symptome)',
			'Symptom-Kategorien mit Häufigkeiten über die Zeit',
			'Zyklen archivieren & vergleichen',
			'DSGVO Art. 9 — besonders verschlüsselt als Gesundheitsdaten',
		],
		tips: ['Je regelmäßiger du einträgst, desto genauer werden die Vorhersagen'],
	},
	finance: {
		description: 'Einnahmen & Ausgaben tracken. Kategorien, Budgets und Monatsübersicht.',
		features: [
			'Einnahmen & Ausgaben mit Betrag und Datum',
			'Eigene Kategorien erstellen',
			'Monatsbudgets pro Kategorie',
			'Typ-Filter (Einnahme/Ausgabe)',
			'AI-Tools: Transaktionen abfragen',
		],
		tips: [
			'Budgets zeigen dir wie viel du pro Kategorie noch übrig hast',
			'Beschreibung und Notizen sind verschlüsselt, Beträge bleiben für Statistiken im Klartext',
		],
	},
	places: {
		description:
			'Lieblingsorte, Restaurants, Cafés — speichern, kategorisieren und Besuche loggen.',
		features: [
			'Orte mit Adresse, Kategorie & Koordinaten',
			'Favoriten markieren',
			'Besuche loggen mit Zeitstempel',
			'Standort-Verlauf',
			'AI-Tools: Orte erstellen, besuchen, durchsuchen',
		],
		tips: [
			'Im Chat: "Speichere das Restaurant Sushi Samba als Favorit"',
			'Standort-Logs laufen im Hintergrund (wenn aktiviert)',
		],
	},
	chat: {
		description:
			'Unterhaltungen mit AI-Assistenten. Verschiedene Modelle, Systemkontexte und Vorlagen.',
		features: [
			'Mehrere parallele Konversationen',
			'System-Prompts & Vorlagen',
			'Verschlüsselte Nachrichten',
			'Modellauswahl',
		],
		tips: [
			'Der Chat hat Zugriff auf alle Modul-Tools — frage einfach was du brauchst',
			'Nutze Vorlagen für wiederkehrende Aufgaben',
		],
	},
	kontext: {
		description: 'Persönliches Markdown-Dokument das der AI als Hintergrundwissen mitgegeben wird.',
		features: [
			'Freitext-Markdown',
			'Wird automatisch in AI-Missionen als Kontext injiziert',
			'Pro Agent individuell konfigurierbar',
		],
		tips: [
			'Schreibe hier Dinge die die AI über dich wissen sollte: Vorlieben, Arbeitsweise, Projekte',
			'Jeder Agent kann ein eigenes Kontext-Dokument haben',
		],
	},
	context: {
		description:
			'Strukturiertes Profil — Interessen, Tagesablauf, Ziele, Ernährung. Hilft der AI dich besser zu verstehen.',
		features: [
			'Geführtes Interview mit Fragen',
			'Strukturierte Sektionen (Über mich, Interessen, Routine, ...)',
			'Freitext-Ergänzung für alles andere',
			'Wird automatisch als AI-Kontext genutzt',
		],
		tips: [
			'Du musst nicht alles ausfüllen — jedes Detail hilft der AI',
			'Das Interview kann jederzeit fortgesetzt werden',
		],
	},
	times: {
		description: 'Zeiterfassung — tracke wie viel Zeit du womit verbringst.',
		features: [
			'Start/Stop Timer',
			'Manuelle Zeiteinträge',
			'Projekt-Zuordnung',
			'Tages- und Wochenübersicht',
		],
		tips: ['Zeiteinträge erscheinen als Zeitblöcke im Kalender'],
	},
	quotes: {
		description:
			'Zitate sammeln, entdecken und wiederfinden. Eigene und aus einer kuratierten Datenbank.',
		features: [
			'Eigene Zitate mit Autor & Quelle erstellen',
			'Kuratierte Zitat-Datenbank zum Stöbern',
			'Kategorien & Zuordnung',
			'Verschlüsselte Inhalte',
		],
		tips: ['Speichere Zitate aus Büchern, Podcasts oder Gesprächen — sie gehen sonst verloren'],
	},
	cards: {
		description: 'Karteikarten zum Lernen. Decks erstellen, Karten durchgehen und Wissen festigen.',
		features: [
			'Decks mit beliebig vielen Karten',
			'Vorderseite / Rückseite',
			'Lernmodus mit Selbstbewertung',
			'Verschlüsselter Inhalt',
		],
		tips: ['Nutze kurze, präzise Fragen auf der Vorderseite für besseren Lerneffekt'],
	},
	picture: {
		description: 'AI-Bildgenerierung — erstelle Bilder mit Textprompts auf deinem GPU-Server.',
		features: [
			'Text-zu-Bild Generierung',
			'Prompt & Negativ-Prompt',
			'Bildgalerie mit Verlauf',
			'Verschiedene Modelle & Stile',
		],
		tips: ['Detaillierte Prompts mit Stil-Angaben liefern bessere Ergebnisse'],
	},
	music: {
		description:
			'Musik-Sammlung und Playlists verwalten. Titel und Metadaten sind verschlüsselt gespeichert.',
		features: [
			'Songs mit Titel, Interpret & Metadaten',
			'Playlists erstellen und sortieren',
			'Verschlüsselte Titel & Beschreibungen',
			'Durchsuchen und Filtern',
		],
		tips: ['Nutze Playlists um Musik nach Stimmung oder Anlass zu sortieren'],
	},
	photos: {
		description:
			'Fotoalben organisieren und durchsuchen. Bilder werden im persönlichen Cloud-Speicher abgelegt.',
		features: [
			'Alben erstellen und benennen',
			'Fotos hochladen & organisieren',
			'Bildvorschau & Vollbild-Ansicht',
			'Gespeichert in deinem privaten MinIO-Speicher',
		],
		tips: ['Fotos werden in deinem persönlichen Speicher abgelegt — nicht bei Drittanbietern'],
	},
	storage: {
		description:
			'Persönlicher Cloud-Speicher — Dateien sicher ablegen, in Ordnern organisieren und per Link teilen.',
		features: [
			'Ordnerstruktur mit Verschachtelung',
			'Drag & Drop Upload',
			'Verschlüsselte Dateinamen',
			'Teilen per Link',
			'Gespeichert auf deinem eigenen Server (MinIO)',
		],
		tips: [
			'Dateien liegen auf deinem eigenen Server — kein Drittanbieter-Cloud',
			'Dateinamen sind verschlüsselt, auch im Speicher nicht im Klartext sichtbar',
		],
	},
	food: {
		description: 'Mahlzeiten tracken mit AI-Unterstützung. Nährwerte werden automatisch erkannt.',
		features: [
			'Mahlzeiten per Text beschreiben',
			'Automatische Nährwertanalyse durch AI',
			'Tagesübersicht mit Kalorien & Makros',
			'AI-Tools: Mahlzeiten loggen, Tages-Zusammenfassung',
		],
		tips: [
			'Beschreibe Mahlzeiten natürlich: "2 Scheiben Vollkornbrot mit Käse und Tomate"',
			'Im Chat: "Was habe ich heute gegessen?"',
		],
	},
	plants: {
		description:
			'Pflanzen katalogisieren — Pflege-Notizen, Standort, Bewässerung und Bodentyp. Ideal für Hobbygärtner.',
		features: [
			'Pflanzen mit Bild, Name & Beschreibung',
			'Temperatur, Bodentyp & Lichtbedarf',
			'Pflege-Notizen pro Pflanze',
			'Verschlüsselte Notizen & Namen',
		],
		tips: [
			'Halte Pflege-Notizen fest: wann gedüngt, umgetopft, geschnitten',
			'Nutze die Temperatur-Angabe als Erinnerung wann Pflanzen reingeholt werden müssen',
		],
	},
	presi: {
		description:
			'Präsentationen mit Folien erstellen. Markdown-basierter Inhalt, verschlüsselt gespeichert.',
		features: [
			'Folien mit Rich-Content erstellen',
			'Markdown-Editor pro Folie',
			'Reihenfolge per Drag & Drop ändern',
			'Verschlüsselter Inhalt (Titel & Folien-Text)',
			'Mehrere Decks verwalten',
		],
		tips: ['Nutze Markdown für schnelle Formatierung: **fett**, *kursiv*, Listen'],
	},
	inventory: {
		description:
			'Sammlungen verwalten — inventarisiere Besitz mit eigenen Feldern, Kategorien und Standorten.',
		features: [
			'Eigene Sammlungen mit Schema-Builder (Felder definieren)',
			'Standorte & Kategorien hierarchisch',
			'Kaufdaten, Fotos & Notizen',
			'Status: besitzt / verliehen / eingelagert / zu verkaufen',
		],
		tips: [
			'Nutze den Schema-Builder um eigene Felder pro Sammlung zu definieren',
			'Standorte können verschachtelt sein (Zuhause → Büro → Schreibtisch)',
		],
	},
	memoro: {
		description:
			'Sprachnotizen aufnehmen und automatisch transkribieren lassen. Durchsuchbar, zusammengefasst und verschlüsselt.',
		features: [
			'Aufnahme mit einem Tap',
			'AI-Transkription (Whisper — läuft lokal im Browser)',
			'Automatische Zusammenfassung & Intro',
			'Durchsuchbare Memos im Volltext',
			'Verschlüsselter Transkript-Text',
		],
		tips: [
			'Die Transkription läuft direkt im Browser — deine Stimme verlässt nie dein Gerät',
			'Nutze Memos als schnelle Gedankennotizen unterwegs',
		],
	},
	questions: {
		description:
			'Fragen sammeln und Antworten festhalten — ein persönliches Q&A-Archiv für Dinge die du herausfinden möchtest.',
		features: [
			'Fragen mit Beschreibung & Kontext',
			'Mehrere Antworten pro Frage sammeln',
			'Verschlüsselter Inhalt',
			'Durchsuchen und Filtern',
		],
		tips: ['Nutze Questions als persönliches Recherche-Archiv: Frage notieren, Antworten ergänzen'],
	},
	skilltree: {
		description:
			'Fähigkeiten visualisieren und Lernfortschritt tracken. Behalte den Überblick über dein Können.',
		features: [
			'Skill-Kategorien definieren (z.B. Sprachen, Technik, Kreativ)',
			'Fortschritt pro Fähigkeit tracken',
			'Fortschritts-Übersicht',
			'Verschlüsselte Inhalte',
		],
		tips: ['Definiere Kategorien nach Lebensbereichen für eine gute Übersicht'],
	},
	moodlit: {
		description:
			'Stimmungslicht und Ambient-Szenen für Fokus und Entspannung. Verwandle deinen Bildschirm in eine Lichtquelle.',
		features: [
			'Verschiedene Licht-Szenen & Farbverläufe',
			'Timer-Funktion für zeitlich begrenzte Sessions',
			'Farbwechsel & Animationen',
			'Vollbild-Modus',
		],
		tips: ['Kombiniere Moodlit mit Meditate für eine immersive Meditationssession'],
	},
	citycorners: {
		description:
			'Interessante Ecken in deiner Stadt entdecken und festhalten. Ein persönlicher Stadtführer.',
		features: [
			'Orte mit Fotos & Beschreibung',
			'Kategorien (Café, Street Art, Architektur, ...)',
			'Standort & Adresse',
			'Entdeckungs-Feed',
		],
		tips: [
			'Halte Orte fest wenn du sie entdeckst — später erinnerst du dich nicht mehr an die Adresse',
		],
	},
	uload: {
		description:
			'Quick-Upload — Dateien schnell hochladen und teilbare Links erstellen. Ideal zum schnellen Teilen.',
		features: [
			'Drag & Drop Upload',
			'Teilbare Download-Links generieren',
			'Verschiedene Dateitypen unterstützt',
			'Gespeichert auf deinem eigenen Server',
		],
		tips: ['Nutze uload für schnelles Teilen — drag die Datei rein, Link kopieren, fertig'],
	},
	calc: {
		description:
			'Taschenrechner mit Berechnungsverlauf. Ergebnisse bleiben gespeichert und sind jederzeit abrufbar.',
		features: [
			'Grundrechenarten & erweiterte Funktionen',
			'Verlauf aller vergangenen Berechnungen',
			'Ergebnisse kopieren & wiederverwenden',
			'Kompakte Ansicht in der Workbench',
		],
	},
	guides: {
		description:
			'Schritt-für-Schritt Anleitungen erstellen und durcharbeiten. Fortschritt wird pro Durchlauf gespeichert.',
		features: [
			'Sektionen mit einzelnen Schritten',
			'Checklisten-Modus zum Abhaken',
			'Fortschritt pro Durchlauf gespeichert',
			'Schwierigkeitsgrade & Kategorien',
			'Geschätzte Dauer pro Guide',
		],
		tips: [
			'Nutze Guides für Onboarding-Prozesse, Checklisten oder wiederkehrende Abläufe',
			'Mehrere Durchläufe zeigen deinen Fortschritt über die Zeit',
		],
	},
	body: {
		description:
			'Fitness-Tracking — Übungen, Workouts, Körpermaße und Trainings-Phasen. Gesundheitsdaten sind besonders geschützt.',
		features: [
			'Übungsbibliothek nach Muskelgruppe & Equipment',
			'Routinen zusammenstellen',
			'Workout-Logging: Sets, Reps, Gewicht',
			'Körpermaße mit Trend-Charts',
			'Tägliche Check-ins (Energie, Schlaf, Muskelkater)',
			'Trainings-Phasen (Aufbau / Diät / Erhaltung)',
			'DSGVO Art. 9 — besonders verschlüsselt',
		],
		tips: [
			'Starte ein Workout von einer Routine aus — die Übungen werden vorgeladen',
			'Körpermaße-Charts zeigen den Trend über Wochen und Monate',
		],
	},
	events: {
		description: 'Soziale Events planen — Gästeliste, RSVP, Bring-Liste und teilbare Einladungen.',
		features: [
			'Gäste einladen (aus Kontakten oder manuell)',
			'RSVP-Status pro Gast',
			'Bring-Liste: wer bringt was?',
			'Teilbare Einladungs-Links',
			'Zeitblock-Integration im Kalender',
		],
		tips: [
			'Teile den Einladungslink — Gäste können ohne Account zusagen',
			'Bring-Listen-Items können von Gästen "reserviert" werden',
		],
	},
	who: {
		description:
			'Rate-Spiel — erkenne Persönlichkeiten anhand von Hinweisen. Die AI gibt dir Schritt für Schritt mehr Informationen.',
		features: [
			'AI gibt dir Hinweise, du rätst die Person',
			'Verschiedene Schwierigkeitsgrade',
			'Spiel-Verlauf mit Statistiken',
			'Chat-basierte Interaktion',
			'Historische und aktuelle Persönlichkeiten',
		],
		tips: [
			'Stelle gezielte Ja/Nein-Fragen um die Person schneller einzugrenzen',
			'Schwierigere Modi geben weniger offensichtliche Hinweise',
		],
	},
	firsts: {
		description:
			'Erste Male festhalten — eine Bucket-List für Dinge die du erleben möchtest, und ein Archiv erlebter Momente.',
		features: [
			'Träume (Bucket List) & erlebte Firsts',
			'Kategorien: Kulinarisch, Abenteuer, Reise, Kreativ, ...',
			'Priorität & Erwartung vs. Realität',
			'Teilen: wer war dabei?',
		],
		tips: ['Nutze "Erwartung vs. Realität" um festzuhalten wie das Erlebnis wirklich war'],
	},
	drink: {
		description:
			'Trink-Tracker mit Tageszielen und schnellen Presets. Behalte deine Hydration im Blick.',
		features: [
			'Quick-Tap Presets (Wasser, Kaffee, Tee, ...)',
			'Tägliches ml-Ziel mit Fortschrittsbalken',
			'Verschiedene Getränketypen mit eigenen Icons',
			'Eigene Presets erstellen',
			'AI-Tools: Einträge loggen, Fortschritt abfragen, rückgängig machen',
		],
		tips: [
			'Im Chat: "Logge ein Glas Wasser" oder "Wie viel habe ich heute getrunken?"',
			'Erstelle Presets für deine häufigsten Getränke mit der richtigen ml-Menge',
		],
	},
	recipes: {
		description:
			'Rezepte sammeln und organisieren — Zutaten, Zubereitungsschritte, Schwierigkeit und Portionsgrößen.',
		features: [
			'Zutaten-Liste mit Mengenangaben',
			'Zubereitungsschritte einzeln dokumentieren',
			'Schwierigkeit & geschätzter Zeitaufwand',
			'Tags & Favoriten zum schnellen Wiederfinden',
			'Verschlüsselte Inhalte',
		],
		tips: [
			'Nutze Tags wie "schnell", "vegetarisch", "Gäste" zum Filtern',
			'Favorisiere deine Lieblingsrezepte für schnellen Zugriff',
		],
	},
	stretch: {
		description: 'Stretching-Routinen mit Übungsbibliothek, Timer und Beweglichkeitstests.',
		features: [
			'Übungen nach Körperregion & Schwierigkeit',
			'Routinen mit Timer zusammenstellen',
			'Beweglichkeits-Assessments (Tests + Schmerzregionen)',
			'Session-Verlauf mit Dauer',
			'Erinnerungen konfigurieren',
		],
		tips: [
			'Starte mit dem Assessment um deinen Ist-Zustand festzuhalten',
			'Regelmäßige Sessions von 10-15 Min sind effektiver als seltene lange',
		],
	},
	mail: {
		description:
			'E-Mail-Entwürfe lokal verfassen und verschlüsselt speichern. Sende sie später über deinen E-Mail-Server.',
		features: [
			'Entwürfe mit Empfänger, CC, Betreff & Text',
			'HTML-Body Support für formatierte Mails',
			'Antworten auf bestehende Nachrichten vorbereiten',
			'Verschlüsselter Inhalt (Empfänger, Betreff, Text)',
		],
		tips: [
			'Entwürfe werden lokal gespeichert — du brauchst keine Internetverbindung zum Schreiben',
		],
	},
	meditate: {
		description:
			'Meditation, Atemübungen und Body Scans. Timer mit Presets und Reflexions-Notizen.',
		features: [
			'Geführte Presets: Atemübungen, Body Scan, freie Meditation',
			'Frei wählbare Dauer',
			'Stimmung vorher / nachher',
			'Session-Verlauf mit Statistiken',
			'Eigene Presets erstellen',
		],
		tips: [
			'Starte mit kurzen Sessions (5 Min) und steigere langsam',
			'Die Stimmungs-Bewertung hilft, den Effekt über die Zeit zu sehen',
		],
	},
	mood: {
		description:
			'Stimmung mehrmals täglich tracken — Emotionen, Intensität, Kontext und Begleitpersonen.',
		features: [
			'Emotionen mit Intensitätsstufe',
			'Aktivität & Begleitpersonen',
			'Freitext-Notizen',
			'Tagesverlauf-Ansicht',
		],
		tips: ['Regelmäßiges Tracken zeigt Muster — z.B. welche Aktivitäten deine Stimmung heben'],
	},
	sleep: {
		description:
			'Schlaf tracken — Qualität, Dauer, Unterbrechungen und eine Schlafhygiene-Checkliste.',
		features: [
			'Schlaf- und Aufwachzeit',
			'Qualitätsbewertung',
			'Unterbrechungen erfassen',
			'Schlafhygiene-Checkliste (eigene Punkte)',
			'DSGVO Art. 9 — besonders verschlüsselt',
		],
		tips: ['Die Hygiene-Checkliste hilft, gute Schlafgewohnheiten zu entwickeln'],
	},
	wishes: {
		description:
			'Wunschliste mit Preiszielen, Produkt-Links und Listen. Organisiere Wünsche nach Anlass.',
		features: [
			'Wünsche mit Zielpreis & Kategorie',
			'Listen erstellen (Geburtstag, Weihnachten, Für mich, ...)',
			'Produkt-URLs pro Wunsch hinterlegen',
			'Preisverlauf-Tracking',
			'Prioritäten & Status (offen / erfüllt / archiviert)',
			'AI-Tools: Wünsche erstellen, auflisten, als erfüllt markieren',
		],
		tips: [
			'Erstelle Listen für verschiedene Anlässe — so behältst du den Überblick',
			'Im Chat: "Setze Sony WH-1000XM5 auf meine Wunschliste, Zielpreis 250€"',
		],
	},
	wetter: {
		description:
			'Wetter für deine Standorte mit detaillierter Vorhersage und Vergleich verschiedener Wettermodelle.',
		features: [
			'Mehrere Standorte speichern & wechseln',
			'Verschiedene Wettermodelle vergleichen (DWD, ECMWF, GFS, ...)',
			'Stunden- und Tagesvorhersage',
			'Temperatur, Wind, Niederschlag & mehr',
			'Standard-Standort festlegen',
		],
		tips: [
			'Vergleiche verschiedene Modelle — bei unsicherem Wetter weichen sie voneinander ab',
			'Lege deinen Heimatort als Standard fest',
		],
	},
	library: {
		description:
			'Medien-Log — Bücher, Filme, Serien und Comics tracken. Status, Fortschritt, Bewertung.',
		features: [
			'Bücher, Filme, Serien, Comics in einer Ansicht',
			'Status: läuft / fertig / geplant / abgebrochen',
			'Fortschritt tracken (Seiten, Episoden, Ausgaben)',
			'Bewertung & Review-Text',
			'Favoriten & Jahresrückblick',
		],
		tips: [
			'Nutze "Geplant" als Merkliste für Empfehlungen',
			'Der Jahresrückblick zeigt was du im laufenden Jahr geschafft hast',
		],
	},
	'news-research': {
		description:
			'RSS-Feeds durchsuchen und Artikel für die News-App entdecken. Kann als Recherche-Tool in AI-Missionen eingebunden werden.',
		features: [
			'RSS-Feeds nach Thema oder URL suchen',
			'Feed-Ergebnisse mit Titel, Datum & Vorschau',
			'Artikel in die News-App speichern',
			'AI-Missions nutzen News Research automatisch für Recherche-Aufträge',
		],
		tips: [
			'Erstelle eine AI-Mission mit "recherchiere" im Ziel — sie nutzt dann automatisch RSS-Feeds',
		],
	},
	myday: {
		description:
			'Tagesübersicht — alles Wichtige auf einen Blick: Termine, Aufgaben, Habits und Stimmung.',
		features: [
			'Heutige Termine & Aufgaben',
			'Habit-Fortschritt des Tages',
			'Schnellzugriff auf häufige Aktionen',
			'AI-Zusammenfassung des Tages',
		],
		tips: ['Nutze MyDay als Startseite um morgens den Überblick zu bekommen'],
	},
	'ai-missions': {
		description:
			'Langlebige AI-Aufträge — definiere ein Ziel, verknüpfe Inputs, und lass den Agenten autonom arbeiten.',
		features: [
			'Ziel und Kontext definieren',
			'Inputs aus anderen Modulen verknüpfen (Notizen, Aufgaben, ...)',
			'Einmalig oder wiederkehrend (täglich, wöchentlich, ...)',
			'Vorschläge prüfen und freigeben',
			'Debug-Log mit vollem Prompt-Verlauf pro Iteration',
			'Server-seitige Ausführung über mana-ai',
		],
		tips: [
			'Starte mit einfachen Missionen: "Erstelle jeden Morgen 3 Aufgaben basierend auf meinen Zielen"',
			'Verknüpfe dein Kontext-Dokument als Input für bessere Ergebnisse',
			'Der Debug-Log hilft zu verstehen warum die AI bestimmte Entscheidungen trifft',
		],
	},
	'ai-agents': {
		description:
			'Benannte AI-Personas mit eigenem System-Prompt, Policy und Gedächtnis. Jeder Agent kann eigene Missionen ausführen.',
		features: [
			'Eigene Agents mit Name, Rolle & Avatar',
			'System-Prompt pro Agent',
			'Policy pro Tool (automatisch / vorschlagen / verbieten)',
			'Agent-Gedächtnis (persistiert über Sessions)',
			'Vorlagen: Recherche-Agent, Kontext-Agent, Today-Agent',
		],
		tips: [
			'Der Standard-Agent "Mana" ist für allgemeine Aufgaben gedacht',
			'Erstelle spezialisierte Agents: z.B. einen "Fitness-Coach" mit entsprechendem Prompt',
			'Die Policy bestimmt ob der Agent eigenständig handelt oder erst fragt',
		],
	},
	'ai-workbench': {
		description:
			'Timeline aller AI-Aktionen. Filtere nach Agent, Modul oder Mission — und mache Aktionen rückgängig.',
		features: [
			'Chronologische Event-Timeline',
			'Filter: nach Agent, Modul, Mission',
			'Iterationen einzeln rückgängig machen',
			'Datenzugriff-Audit (welche Daten hat die AI gelesen?)',
		],
		tips: [
			'Nutze den Revert-Button um eine ganze AI-Iteration rückgängig zu machen',
			'Der Datenzugriff-Tab zeigt genau welche verschlüsselten Daten entschlüsselt wurden',
		],
	},
	goals: {
		description:
			'Ziele setzen und Fortschritt verfolgen. Verknüpft sich mit AI-Missionen und dem Kontext-Profil.',
		features: [
			'Ziele mit Status definieren (offen / in Arbeit / erreicht)',
			'Modulübergreifende Verknüpfung mit Aufgaben & Habits',
			'AI-Tools: Ziele abfragen und in Missionen referenzieren',
			'Ziele als Input für AI-Missionen nutzen',
		],
		tips: [
			'Verknüpfe Ziele mit AI-Missionen — der Agent kann dann Aufgaben daraus ableiten',
			'Formuliere Ziele konkret und messbar für bessere AI-Unterstützung',
		],
	},
	playground: {
		description:
			'LLM-Spielwiese — verschiedene Modelle und System-Prompts ausprobieren. Perfekt zum Experimentieren.',
		features: [
			'Freie Konversationen',
			'System-Prompt-Snippets speichern & wiederverwenden',
			'Modellauswahl (verschiedene AI-Modelle)',
			'Verschlüsselter Verlauf',
		],
	},
	quiz: {
		description:
			'Eigene Quizze bauen und spielen. Single-Choice, Multiple-Choice, Wahr/Falsch oder Freitext.',
		features: [
			'Verschiedene Fragetypen',
			'Erklärungen pro Frage',
			'Spiel-Versuche mit Score & Verlauf',
			'Verschlüsselte Fragen & Antworten',
		],
		tips: ['Nutze Erklärungen um den Lerneffekt zu maximieren'],
	},
	automations: {
		description:
			'Wenn-Dann Regeln zwischen Modulen — automatisiere wiederkehrende Abläufe ohne Code.',
		features: [
			'Trigger aus einem Modul wählen (z.B. neue Aufgabe erstellt)',
			'Aktion in einem anderen Modul definieren (z.B. Notiz erstellen)',
			'Aktivieren / Deaktivieren per Toggle',
			'Quell- und Ziel-Modul frei kombinieren',
		],
		tips: [
			'Starte einfach: z.B. "Wenn ein neuer Kontakt erstellt wird, erstelle eine Aufgabe zum Kennenlernen"',
		],
	},
};
