import type { SiteTemplate } from './types';

/**
 * Event microsite — Hochzeit, Geburtstag, Konferenz, Workshop.
 * Drei Seiten: Start · Programm · RSVP (Anmeldeformular).
 */
export const eventTemplate: SiteTemplate = {
	id: 'event',
	name: 'Event',
	description: 'Hochzeit, Geburtstag, Konferenz — mit Programm und RSVP-Formular.',
	tag: 'event',
	pages: [
		{
			path: '/',
			title: 'Start',
			order: 1024,
			blocks: [
				{
					localId: 'hero',
					type: 'hero',
					props: {
						eyebrow: 'Save the Date',
						title: '[Event-Name]',
						subtitle: '[Datum] · [Ort]. Wir freuen uns auf dich.',
						ctaLabel: 'Jetzt anmelden',
						ctaHref: '/anmelden',
						align: 'center',
						background: 'gradient',
					},
				},
				{
					localId: 'intro',
					type: 'richText',
					props: {
						content:
							'Kurze Einleitung zum Event — worum geht es, wer ist eingeladen, was erwartet die Gäste.\n\nEin zweiter Absatz mit weiteren Details ist optional.',
						align: 'center',
						size: 'md',
					},
				},
				{
					localId: 'faq',
					type: 'faq',
					props: {
						title: 'Häufige Fragen',
						defaultOpen: false,
						items: [
							{ question: 'Wo findet das Event statt?', answer: '[Adresse]' },
							{ question: 'Gibt es Parkmöglichkeiten?', answer: 'Ja, direkt vor Ort.' },
							{
								question: 'Wie ist die Kleiderordnung?',
								answer: 'Smart casual — komm so, wie du dich wohlfühlst.',
							},
						],
					},
				},
			],
		},
		{
			path: '/programm',
			title: 'Programm',
			order: 2048,
			blocks: [
				{
					localId: 'hero',
					type: 'hero',
					props: {
						title: 'Programm',
						subtitle: 'So läuft der Tag ab.',
						align: 'left',
						background: 'subtle',
					},
				},
				{
					localId: 'agenda',
					type: 'richText',
					props: {
						content:
							'**15:00** · Empfang mit Welcome-Drink\n\n**16:00** · Trauung / Eröffnung\n\n**17:30** · Fotoshooting, Sektempfang\n\n**19:00** · Abendessen\n\n**21:00** · Party bis open end',
						align: 'left',
						size: 'lg',
					},
				},
			],
		},
		{
			path: '/anmelden',
			title: 'Anmelden',
			order: 3072,
			blocks: [
				{
					localId: 'hero',
					type: 'hero',
					props: {
						title: 'RSVP',
						subtitle: 'Bitte melde dich bis [Datum] an.',
						align: 'center',
						background: 'subtle',
					},
				},
				{
					localId: 'form',
					type: 'form',
					props: {
						title: '',
						description: '',
						submitLabel: 'Anmeldung senden',
						successMessage: 'Danke für deine Anmeldung! Wir freuen uns auf dich.',
						target: 'inbox',
						fields: [
							{
								name: 'name',
								label: 'Name',
								type: 'text',
								required: true,
								placeholder: '',
								helpText: '',
								maxLength: 120,
							},
							{
								name: 'email',
								label: 'E-Mail',
								type: 'email',
								required: true,
								placeholder: '',
								helpText: 'Für die Bestätigung.',
								maxLength: 200,
							},
							{
								name: 'plusOne',
								label: 'Begleitung',
								type: 'text',
								required: false,
								placeholder: 'Name der Begleitung',
								helpText: 'Leer lassen, wenn du alleine kommst.',
								maxLength: 120,
							},
							{
								name: 'notes',
								label: 'Anmerkungen',
								type: 'textarea',
								required: false,
								placeholder: 'Allergien, Unverträglichkeiten, Sonstiges',
								helpText: '',
								maxLength: 1000,
							},
						],
					},
				},
			],
		},
	],
};
