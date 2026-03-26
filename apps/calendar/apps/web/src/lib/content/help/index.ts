/**
 * Help content for Calendar app
 */

import type { HelpContent } from '@manacore/shared-help-types';
import { getPrivacyFAQs } from '@manacore/shared-help-types';

export function getCalendarHelpContent(locale: string): HelpContent {
	const isDE = locale === 'de';
	const isFR = locale === 'fr';
	const isIT = locale === 'it';
	const isES = locale === 'es';

	function t(de: string, en: string, fr?: string, it?: string, es?: string): string {
		if (isDE) return de;
		if (isFR) return fr ?? en;
		if (isIT) return it ?? en;
		if (isES) return es ?? en;
		return en;
	}

	return {
		faq: [
			{
				id: 'faq-create-event',
				question: t(
					'Wie erstelle ich einen Termin?',
					'How do I create an event?',
					'Comment créer un événement ?',
					'Come creo un evento?',
					'¿Cómo creo un evento?'
				),
				answer: t(
					'<p>Du kannst Termine auf verschiedene Arten erstellen:</p><ul><li><strong>Schnelleingabe</strong>: Nutze die Eingabeleiste oben — tippe z.B. "Meeting morgen 14-16 Uhr @Arbeit"</li><li><strong>Klick & Ziehen</strong>: Klicke und ziehe in der Wochenansicht, um einen Zeitraum auszuwählen</li><li><strong>Neuer Termin</strong>: Klicke auf das + Symbol für das vollständige Formular</li></ul>',
					'<p>You can create events in several ways:</p><ul><li><strong>Quick input</strong>: Use the input bar at the top — type e.g. "Meeting tomorrow 2-4pm @Work"</li><li><strong>Click & drag</strong>: Click and drag in the week view to select a time range</li><li><strong>New event</strong>: Click the + icon for the full form</li></ul>'
				),
				category: 'features',
				order: 1,
				language: isDE ? 'de' : isFR ? 'fr' : isIT ? 'it' : isES ? 'es' : 'en',
				tags: isDE ? ['termin', 'erstellen', 'neu'] : ['event', 'create', 'new'],
			},
			{
				id: 'faq-recurring',
				question: t(
					'Wie erstelle ich wiederkehrende Termine?',
					'How do I create recurring events?'
				),
				answer: t(
					'<p>Öffne einen Termin und setze die <strong>Wiederholung</strong>. Unterstützte Optionen:</p><ul><li>Täglich, wöchentlich, monatlich, jährlich</li><li>Bestimmte Wochentage (z.B. Mo, Mi, Fr)</li><li>Alle X Wochen/Monate</li><li>Enddatum oder Anzahl der Wiederholungen</li></ul><p>In der Schnelleingabe kannst du auch "wöchentlich", "täglich" oder "jeden Montag" eingeben.</p>',
					'<p>Open an event and set the <strong>recurrence</strong>. Supported options:</p><ul><li>Daily, weekly, monthly, yearly</li><li>Specific weekdays (e.g. Mon, Wed, Fri)</li><li>Every X weeks/months</li><li>End date or number of occurrences</li></ul><p>In the quick input, you can also type "weekly", "daily", or "every Monday".</p>'
				),
				category: 'features',
				order: 2,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['wiederkehrend', 'wiederholung', 'serie'] : ['recurring', 'repeat', 'series'],
			},
			{
				id: 'faq-share-calendar',
				question: t(
					'Wie teile ich einen Kalender mit anderen?',
					'How do I share a calendar with others?'
				),
				answer: t(
					'<p>Gehe zu <strong>Einstellungen > Freigabe</strong> und wähle den Kalender aus. Du kannst:</p><ul><li><strong>Per E-Mail</strong> einladen (Lese- oder Schreibzugriff)</li><li><strong>Per Link</strong> teilen (mit optionalem Ablaufdatum)</li><li>Berechtigungen nachträglich ändern oder entziehen</li></ul>',
					'<p>Go to <strong>Settings > Sharing</strong> and select the calendar. You can:</p><ul><li><strong>Invite by email</strong> (read or write access)</li><li><strong>Share by link</strong> (with optional expiration)</li><li>Change or revoke permissions later</li></ul>'
				),
				category: 'features',
				order: 3,
				language: isDE ? 'de' : 'en',
				tags: isDE ? ['teilen', 'freigabe', 'einladen'] : ['share', 'invite', 'permissions'],
			},
			{
				id: 'faq-sync',
				question: t('Kann ich externe Kalender synchronisieren?', 'Can I sync external calendars?'),
				answer: t(
					'<p>Ja! Gehe zu <strong>Einstellungen > Sync</strong>. Unterstützte Quellen:</p><ul><li><strong>CalDAV</strong>: Nextcloud, Radicale, etc.</li><li><strong>iCal URL</strong>: Jeder öffentliche Kalender-Feed</li><li><strong>Google Kalender</strong> (über CalDAV)</li><li><strong>Apple Kalender</strong> (über CalDAV)</li></ul><p>Die Synchronisation erfolgt automatisch im eingestellten Intervall.</p>',
					'<p>Yes! Go to <strong>Settings > Sync</strong>. Supported sources:</p><ul><li><strong>CalDAV</strong>: Nextcloud, Radicale, etc.</li><li><strong>iCal URL</strong>: Any public calendar feed</li><li><strong>Google Calendar</strong> (via CalDAV)</li><li><strong>Apple Calendar</strong> (via CalDAV)</li></ul><p>Synchronization happens automatically at the configured interval.</p>'
				),
				category: 'technical',
				order: 4,
				language: isDE ? 'de' : 'en',
				tags: isDE
					? ['sync', 'caldav', 'google', 'apple', 'extern']
					: ['sync', 'caldav', 'google', 'apple', 'external'],
			},
			...getPrivacyFAQs(locale, { dataTypeDE: 'Kalenderdaten', dataTypeEN: 'calendar data' }),
		],
		features: [
			{
				id: 'feature-calendars',
				title: t('Mehrere Kalender', 'Multiple Calendars'),
				description: t(
					'Erstelle farbcodierte Kalender für Arbeit, Privat und mehr',
					'Create color-coded calendars for work, personal, and more'
				),
				icon: '📅',
				category: 'core',
				highlights: t(
					'Farbcodierung,Ein-/Ausblenden,Standard-Kalender',
					'Color coding,Show/hide,Default calendar'
				).split(','),
				content: '',
				order: 1,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-views',
				title: t('Flexible Ansichten', 'Flexible Views'),
				description: t(
					'Wechsle zwischen Tag-, Wochen-, Monats- und Agenda-Ansicht',
					'Switch between day, week, month, and agenda views'
				),
				icon: '👁️',
				category: 'core',
				highlights: t(
					'Wochenansicht,Monatsansicht,Agenda-Liste,Tagesansicht',
					'Week view,Month view,Agenda list,Day view'
				).split(','),
				content: '',
				order: 2,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-recurring',
				title: t('Wiederkehrende Termine', 'Recurring Events'),
				description: t(
					'Erstelle Serien mit flexiblen Wiederholungsregeln',
					'Create series with flexible recurrence rules'
				),
				icon: '🔄',
				category: 'advanced',
				highlights: t(
					'RFC 5545 RRULE,Ausnahmen,Enddatum oder Anzahl',
					'RFC 5545 RRULE,Exceptions,End date or count'
				).split(','),
				content: '',
				order: 3,
				language: isDE ? 'de' : 'en',
			},
			{
				id: 'feature-sharing',
				title: t('Kalender teilen', 'Calendar Sharing'),
				description: t(
					'Teile Kalender mit Lese- oder Schreibzugriff',
					'Share calendars with read or write access'
				),
				icon: '🤝',
				category: 'advanced',
				highlights: t(
					'E-Mail-Einladung,Link-Freigabe,Berechtigungen',
					'Email invitation,Link sharing,Permissions'
				).split(','),
				content: '',
				order: 4,
				language: isDE ? 'de' : 'en',
			},
		],
		shortcuts: [
			{
				id: 'shortcuts-navigation',
				category: 'navigation',
				title: 'Navigation',
				language: isDE ? 'de' : 'en',
				order: 1,
				shortcuts: [
					{
						shortcut: 'Cmd/Ctrl + 1',
						action: t('Kalender öffnen', 'Open Calendar'),
					},
					{
						shortcut: 'Cmd/Ctrl + 2',
						action: t('Aufgaben öffnen', 'Open Tasks'),
					},
					{
						shortcut: 'Cmd/Ctrl + 3',
						action: t('Einstellungen öffnen', 'Open Settings'),
					},
				],
			},
			{
				id: 'shortcuts-calendar',
				category: 'app-specific',
				title: t('Kalender', 'Calendar'),
				language: isDE ? 'de' : 'en',
				order: 2,
				shortcuts: [
					{
						shortcut: 'Enter / Space',
						action: t('Event/Task öffnen', 'Open event/task'),
					},
					{
						shortcut: 'Esc',
						action: t('Drag/Resize abbrechen', 'Cancel drag/resize'),
					},
				],
			},
		],
		gettingStarted: [],
		changelog: [],
		contact: {
			id: 'contact-support',
			title: t('Support kontaktieren', 'Contact Support'),
			content: t(
				'<p>Unser Support-Team hilft dir bei allen Fragen rund um den Kalender.</p>',
				'<p>Our support team is here to help you with any calendar-related questions.</p>'
			),
			language: isDE ? 'de' : 'en',
			order: 1,
			supportEmail: 'support@mana.how',
			documentationUrl: 'https://mana.how/docs',
			responseTime: t('Normalerweise innerhalb von 24 Stunden', 'Usually within 24 hours'),
		},
	};
}
