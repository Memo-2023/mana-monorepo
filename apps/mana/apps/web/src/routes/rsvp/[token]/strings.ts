/**
 * Inline i18n dictionary for the public RSVP page.
 * Kept tiny and local — this page is the only public consumer.
 */

export type Lang = 'de' | 'en' | 'it' | 'fr' | 'es';

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
	it: {
		rsvpTitle: 'Conferma la tua presenza',
		pageTitleSuffix: '— RSVP',
		allDay: 'Tutto il giorno',
		peopleAttending: 'persone parteciperanno',
		cancelledNotice: '⚠️ Questo evento è stato annullato.',
		successHeading: 'Grazie per la tua risposta!',
		successYou: 'Hai risposto',
		successComing: '«Sì, vengo»',
		successNotComing: '«No»',
		successMaybe: '«Forse»',
		successHint:
			'. Puoi riaprire questa pagina in qualsiasi momento per modificare la tua risposta.',
		changeAnswer: 'Modifica risposta',
		formHeading: 'Conferma la tua presenza',
		yourName: 'Il tuo nome',
		yourNamePlaceholder: 'es. Anna Bianchi',
		emailLabel: 'Email (facoltativa)',
		emailPlaceholder: 'anna@example.com',
		areYouComing: 'Vieni?',
		yesComing: '✓ Sì, vengo',
		maybe: '? Forse',
		no: '✕ No',
		bringingPeople: (count) => `Porti qualcuno con te? (${count})`,
		noteLabel: 'Nota (facoltativa)',
		notePlaceholder: 'es. «Arrivo solo verso le 20»',
		send: 'Invia risposta',
		sending: 'Invio...',
		genericError: 'Impossibile inviare',
		poweredBy: 'Powered by',
		dateLocale: 'it-IT',
	},
	fr: {
		rsvpTitle: 'Confirmez votre présence',
		pageTitleSuffix: '— RSVP',
		allDay: 'Toute la journée',
		peopleAttending: 'personnes participeront',
		cancelledNotice: '⚠️ Cet événement a été annulé.',
		successHeading: 'Merci pour ta réponse !',
		successYou: 'Tu as répondu',
		successComing: '« Oui, je viens »',
		successNotComing: '« Non »',
		successMaybe: '« Peut-être »',
		successHint: '. Tu peux rouvrir cette page à tout moment pour modifier ta réponse.',
		changeAnswer: 'Modifier la réponse',
		formHeading: 'Confirmez votre présence',
		yourName: 'Ton nom',
		yourNamePlaceholder: 'p. ex. Anna Martin',
		emailLabel: 'E-mail (facultatif)',
		emailPlaceholder: 'anna@example.com',
		areYouComing: 'Tu viens ?',
		yesComing: '✓ Oui, je viens',
		maybe: '? Peut-être',
		no: '✕ Non',
		bringingPeople: (count) => `Tu amènes quelqu’un ? (${count})`,
		noteLabel: 'Note (facultative)',
		notePlaceholder: 'p. ex. « J’arrive vers 20h »',
		send: 'Envoyer la réponse',
		sending: 'Envoi...',
		genericError: 'Impossible d’envoyer',
		poweredBy: 'Propulsé par',
		dateLocale: 'fr-FR',
	},
	es: {
		rsvpTitle: 'Confirma tu asistencia',
		pageTitleSuffix: '— RSVP',
		allDay: 'Todo el día',
		peopleAttending: 'personas asistirán',
		cancelledNotice: '⚠️ Este evento ha sido cancelado.',
		successHeading: '¡Gracias por tu respuesta!',
		successYou: 'Has respondido',
		successComing: '«Sí, voy»',
		successNotComing: '«No»',
		successMaybe: '«Quizás»',
		successHint:
			'. Puedes volver a abrir esta página en cualquier momento para cambiar tu respuesta.',
		changeAnswer: 'Cambiar respuesta',
		formHeading: 'Confirma tu asistencia',
		yourName: 'Tu nombre',
		yourNamePlaceholder: 'p. ej. Ana García',
		emailLabel: 'Correo (opcional)',
		emailPlaceholder: 'ana@example.com',
		areYouComing: '¿Vienes?',
		yesComing: '✓ Sí, voy',
		maybe: '? Quizás',
		no: '✕ No',
		bringingPeople: (count) => `¿Traes a alguien contigo? (${count})`,
		noteLabel: 'Nota (opcional)',
		notePlaceholder: 'p. ej. «Llego sobre las 20h»',
		send: 'Enviar respuesta',
		sending: 'Enviando...',
		genericError: 'No se pudo enviar',
		poweredBy: 'Powered by',
		dateLocale: 'es-ES',
	},
};

export function getStrings(lang: Lang): Strings {
	return DICTS[lang] ?? DICTS.de;
}
