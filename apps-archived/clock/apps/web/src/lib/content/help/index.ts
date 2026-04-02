/**
 * Help content for Clock app
 */

import type { HelpContent } from '@manacore/help';
import { getPrivacyFAQs } from '@manacore/help';

export function getClockHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';

	return {
		faq: [
			{
				id: 'faq-create-alarms',
				question: isDE ? 'Wie erstelle ich Wecker?' : 'How do I create alarms?',
				answer: isDE
					? '<p>Du kannst Wecker auf verschiedene Arten erstellen:</p><ul><li><strong>Schnellwecker</strong>: Drücke <kbd>A</kbd> oder klicke auf das + Symbol im Wecker-Tab</li><li><strong>Uhrzeit wählen</strong>: Stelle Stunde und Minute ein und wähle die gewünschten Wochentage</li><li><strong>Label</strong>: Gib deinem Wecker einen Namen, z.B. "Morgenroutine"</li><li><strong>Klingelton</strong>: Wähle aus verschiedenen Tönen oder nutze einen sanften Weckton</li></ul>'
					: '<p>You can create alarms in several ways:</p><ul><li><strong>Quick alarm</strong>: Press <kbd>A</kbd> or click the + icon in the Alarms tab</li><li><strong>Set time</strong>: Choose hour and minute and select the desired weekdays</li><li><strong>Label</strong>: Give your alarm a name, e.g. "Morning routine"</li><li><strong>Ringtone</strong>: Choose from various sounds or use a gentle wake-up tone</li></ul>',
				category: 'features',
				order: 1,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['wecker', 'erstellen', 'neu'] : ['alarm', 'create', 'new'],
			},
			{
				id: 'faq-timers',
				question: isDE
					? 'Wie funktionieren Timer und Stoppuhr?'
					: 'How do timers and the stopwatch work?',
				answer: isDE
					? '<p>Clock bietet zwei Zeitmesser:</p><ul><li><strong>Timer</strong>: Stelle eine Countdown-Zeit ein und starte ihn. Du kannst mehrere Timer gleichzeitig laufen lassen. Drücke <kbd>T</kbd> für einen neuen Timer.</li><li><strong>Stoppuhr</strong>: Messe verstrichene Zeit mit Rundenzeiten. Starte, pausiere und setze zurück.</li></ul><p>Beide laufen auch im Hintergrund weiter und benachrichtigen dich, wenn die Zeit abgelaufen ist.</p>'
					: '<p>Clock offers two time measurement tools:</p><ul><li><strong>Timer</strong>: Set a countdown duration and start it. You can run multiple timers simultaneously. Press <kbd>T</kbd> for a new timer.</li><li><strong>Stopwatch</strong>: Measure elapsed time with lap splits. Start, pause, and reset.</li></ul><p>Both continue running in the background and notify you when time is up.</p>',
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['timer', 'stoppuhr', 'countdown'] : ['timer', 'stopwatch', 'countdown'],
			},
			{
				id: 'faq-pomodoro',
				question: isDE ? 'Was ist die Pomodoro-Technik?' : 'What is the Pomodoro technique?',
				answer: isDE
					? '<p>Die <strong>Pomodoro-Technik</strong> ist eine Zeitmanagement-Methode:</p><ol><li>Arbeite <strong>25 Minuten</strong> konzentriert (ein "Pomodoro")</li><li>Mache eine <strong>5-Minuten-Pause</strong></li><li>Nach 4 Pomodoros: <strong>15-30 Minuten</strong> längere Pause</li></ol><p>In Clock kannst du die Intervalle anpassen, deinen Fortschritt verfolgen und Statistiken über deine Produktivität einsehen.</p>'
					: '<p>The <strong>Pomodoro technique</strong> is a time management method:</p><ol><li>Work for <strong>25 minutes</strong> with focus (one "Pomodoro")</li><li>Take a <strong>5-minute break</strong></li><li>After 4 Pomodoros: take a <strong>15-30 minute</strong> longer break</li></ol><p>In Clock you can customize the intervals, track your progress, and view statistics about your productivity.</p>',
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['pomodoro', 'produktivität', 'fokus', 'technik']
					: ['pomodoro', 'productivity', 'focus', 'technique'],
			},
			{
				id: 'faq-life-clock',
				question: isDE ? 'Was ist die Life Clock?' : 'What is the Life Clock?',
				answer: isDE
					? '<p>Die <strong>Life Clock</strong> ist eine einzigartige Visualisierung deiner Lebenszeit:</p><ul><li>Gib dein Geburtsdatum und deine geschätzte Lebenserwartung ein</li><li>Sieh, wie viel deiner Zeit bereits vergangen ist und wie viel noch vor dir liegt</li><li>Verschiedene Darstellungen: Wochen, Monate oder Jahre als Raster</li></ul><p>Die Life Clock soll dich motivieren, deine Zeit bewusst zu nutzen — keine Angst, sondern <strong>Inspiration</strong>.</p>'
					: '<p>The <strong>Life Clock</strong> is a unique visualization of your lifetime:</p><ul><li>Enter your birth date and estimated life expectancy</li><li>See how much of your time has passed and how much lies ahead</li><li>Various display modes: weeks, months, or years as a grid</li></ul><p>The Life Clock is meant to motivate you to use your time mindfully — not fear, but <strong>inspiration</strong>.</p>',
				category: 'features',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['life-clock', 'lebenszeit', 'visualisierung']
					: ['life-clock', 'lifetime', 'visualization'],
			},
			...getPrivacyFAQs(locale, {
				dataTypeDE: 'Daten',
				dataTypeEN: 'data',
				extraBulletsDE: [
					'<strong>Lokale Speicherung</strong>: Wecker und Timer werden lokal auf deinem Gerät gespeichert',
				],
				extraBulletsEN: [
					'<strong>Local storage</strong>: Alarms and timers are stored locally on your device',
				],
			}),
		],
		features: [
			{
				id: 'feature-alarms',
				title: isDE ? 'Wecker' : 'Alarms',
				description: isDE
					? 'Erstelle wiederkehrende und einmalige Wecker mit individuellen Tönen'
					: 'Create recurring and one-time alarms with custom sounds',
				icon: '⏰',
				category: 'core',
				highlights: isDE
					? ['Wiederkehrende Wecker', 'Individuelle Töne', 'Schlummerfunktion', 'Labels']
					: ['Recurring alarms', 'Custom sounds', 'Snooze function', 'Labels'],
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-timers-stopwatch',
				title: isDE ? 'Timer & Stoppuhr' : 'Timers & Stopwatch',
				description: isDE
					? 'Mehrere gleichzeitige Timer und eine Stoppuhr mit Rundenzeiten'
					: 'Multiple simultaneous timers and a stopwatch with lap times',
				icon: '⏱️',
				category: 'core',
				highlights: isDE
					? ['Mehrere Timer', 'Rundenzeiten', 'Hintergrund-Benachrichtigung', 'Voreinstellungen']
					: ['Multiple timers', 'Lap times', 'Background notifications', 'Presets'],
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-pomodoro',
				title: 'Pomodoro',
				description: isDE
					? 'Steigere deine Produktivität mit der Pomodoro-Technik und Statistiken'
					: 'Boost your productivity with the Pomodoro technique and statistics',
				icon: '🍅',
				category: 'advanced',
				highlights: isDE
					? ['Anpassbare Intervalle', 'Sitzungs-Tracking', 'Statistiken', 'Benachrichtigungen']
					: ['Customizable intervals', 'Session tracking', 'Statistics', 'Notifications'],
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-world-clock',
				title: isDE ? 'Weltzeituhr' : 'World Clock',
				description: isDE
					? 'Behalte die Uhrzeit in verschiedenen Zeitzonen im Blick'
					: 'Keep track of the time across different time zones',
				icon: '🌍',
				category: 'core',
				highlights: isDE
					? ['Alle Zeitzonen', 'Zeitvergleich', 'Favoriten', 'Analoges Zifferblatt']
					: ['All time zones', 'Time comparison', 'Favorites', 'Analog clock face'],
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [
			{
				id: 'shortcuts-general',
				category: 'general',
				title: isDE ? 'Allgemein' : 'General',
				language: isDE ? 'de' : 'en',
				order: 1,
				shortcuts: [
					{
						shortcut: 'Cmd/Ctrl + K',
						action: isDE ? 'Kommandoleiste öffnen' : 'Open command bar',
					},
					{
						shortcut: 'A',
						action: isDE ? 'Neuer Wecker' : 'New alarm',
					},
					{
						shortcut: 'T',
						action: isDE ? 'Neuer Timer' : 'New timer',
					},
				],
			},
			{
				id: 'shortcuts-navigation',
				category: 'navigation',
				title: 'Navigation',
				language: isDE ? 'de' : 'en',
				order: 2,
				shortcuts: [
					{
						shortcut: 'Cmd/Ctrl + 1',
						action: isDE ? 'Wecker öffnen' : 'Open Alarms',
					},
					{
						shortcut: 'Cmd/Ctrl + 2',
						action: isDE ? 'Timer öffnen' : 'Open Timers',
					},
					{
						shortcut: 'Cmd/Ctrl + 3',
						action: isDE ? 'Stoppuhr öffnen' : 'Open Stopwatch',
					},
					{
						shortcut: 'Cmd/Ctrl + 4',
						action: isDE ? 'Pomodoro öffnen' : 'Open Pomodoro',
					},
					{
						shortcut: 'Cmd/Ctrl + 5',
						action: isDE ? 'Weltzeituhr öffnen' : 'Open World Clock',
					},
					{
						shortcut: 'Cmd/Ctrl + 6',
						action: isDE ? 'Life Clock öffnen' : 'Open Life Clock',
					},
					{
						shortcut: 'Cmd/Ctrl + 7',
						action: isDE ? 'Statistiken öffnen' : 'Open Statistics',
					},
					{
						shortcut: 'Cmd/Ctrl + 8',
						action: isDE ? 'Einstellungen öffnen' : 'Open Settings',
					},
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: isDE ? 'Support kontaktieren' : 'Contact Support',
			content: isDE
				? '<p>Unser Support-Team hilft dir bei allen Fragen rund um Clock.</p>'
				: '<p>Our support team is here to help you with any questions about Clock.</p>',
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: isDE ? 'Normalerweise innerhalb von 24 Stunden' : 'Usually within 24 hours',
		},
	};
}
