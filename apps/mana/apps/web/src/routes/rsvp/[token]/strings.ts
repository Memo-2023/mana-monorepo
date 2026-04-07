/**
 * Inline i18n dictionary for the public RSVP page.
 * Kept tiny and local — this page is the only public consumer.
 */

export type Lang = 'de' | 'en';

interface Strings {
	rsvpTitle: string;
	pageTitleSuffix: string;
	allDay: string;
	peopleAttending: string;
	cancelledNotice: string;
	successHeading: string;
	successYou: string;
	successComing: string;
	successNotComing: string;
	successMaybe: string;
	successHint: string;
	changeAnswer: string;
	formHeading: string;
	yourName: string;
	yourNamePlaceholder: string;
	emailLabel: string;
	emailPlaceholder: string;
	areYouComing: string;
	yesComing: string;
	maybe: string;
	no: string;
	bringingPeople: (count: number) => string;
	noteLabel: string;
	notePlaceholder: string;
	send: string;
	sending: string;
	genericError: string;
	poweredBy: string;
	dateLocale: string;
}

const DICTS: Record<Lang, Strings> = {
	de: {
		rsvpTitle: 'Sag bitte zu',
		pageTitleSuffix: '— RSVP',
		allDay: 'Ganztägig',
		peopleAttending: 'Personen kommen',
		cancelledNotice: '⚠️ Dieses Event wurde abgesagt.',
		successHeading: 'Danke für deine Antwort!',
		successYou: 'Du hast mit',
		successComing: '„Ja, komme“',
		successNotComing: '„Nein“',
		successMaybe: '„Vielleicht“',
		successHint:
			'geantwortet. Du kannst diese Seite jederzeit erneut öffnen, um deine Antwort zu ändern.',
		changeAnswer: 'Antwort ändern',
		formHeading: 'Sag bitte zu',
		yourName: 'Dein Name',
		yourNamePlaceholder: 'z. B. Anna Schmidt',
		emailLabel: 'E-Mail (optional)',
		emailPlaceholder: 'anna@example.com',
		areYouComing: 'Kommst du?',
		yesComing: '✓ Ja, komme',
		maybe: '? Vielleicht',
		no: '✕ Nein',
		bringingPeople: (count) => `Bringst du jemanden mit? (${count})`,
		noteLabel: 'Notiz (optional)',
		notePlaceholder: 'z. B. „Komme erst um 20 Uhr“',
		send: 'Antwort senden',
		sending: 'Sende...',
		genericError: 'Konnte nicht senden',
		poweredBy: 'Powered by',
		dateLocale: 'de-DE',
	},
	en: {
		rsvpTitle: 'Please RSVP',
		pageTitleSuffix: '— RSVP',
		allDay: 'All day',
		peopleAttending: 'people attending',
		cancelledNotice: '⚠️ This event has been cancelled.',
		successHeading: 'Thanks for your reply!',
		successYou: 'You answered',
		successComing: '"Yes, coming"',
		successNotComing: '"No"',
		successMaybe: '"Maybe"',
		successHint: '. You can reopen this page anytime to change your answer.',
		changeAnswer: 'Change answer',
		formHeading: 'Please RSVP',
		yourName: 'Your name',
		yourNamePlaceholder: 'e.g. Anna Smith',
		emailLabel: 'Email (optional)',
		emailPlaceholder: 'anna@example.com',
		areYouComing: 'Are you coming?',
		yesComing: '✓ Yes, coming',
		maybe: '? Maybe',
		no: '✕ No',
		bringingPeople: (count) => `Bringing anyone? (${count})`,
		noteLabel: 'Note (optional)',
		notePlaceholder: 'e.g. "Will arrive at 8pm"',
		send: 'Send reply',
		sending: 'Sending...',
		genericError: 'Could not send',
		poweredBy: 'Powered by',
		dateLocale: 'en-US',
	},
};

export function getStrings(lang: Lang): Strings {
	return DICTS[lang] ?? DICTS.de;
}
