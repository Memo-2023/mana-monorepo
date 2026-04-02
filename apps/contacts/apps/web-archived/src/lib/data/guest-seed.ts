/**
 * Guest seed data for the Contacts app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They showcase the app with realistic sample contacts.
 */

import type { LocalContact } from './local-store';

export const guestContacts: LocalContact[] = [
	{
		id: 'guest-contact-1',
		firstName: 'Anna',
		lastName: 'Mueller',
		email: 'anna.mueller@example.com',
		phone: '+49 30 12345678',
		company: 'Tech Solutions GmbH',
		jobTitle: 'Product Manager',
		address: 'Berlin, Deutschland',
		notes: 'Ansprechpartnerin fuer das neue Projekt',
		birthday: '1990-06-15',
		tags: ['Arbeit'],
		isFavorite: true,
		isArchived: false,
	},
	{
		id: 'guest-contact-2',
		firstName: 'Max',
		lastName: 'Schmidt',
		email: 'max.schmidt@example.com',
		phone: '+49 171 9876543',
		company: 'Design Studio',
		jobTitle: 'UX Designer',
		address: 'Muenchen, Deutschland',
		tags: ['Arbeit', 'Freunde'],
		isFavorite: false,
		isArchived: false,
	},
	{
		id: 'guest-contact-3',
		firstName: 'Lisa',
		lastName: 'Weber',
		email: 'lisa.w@example.com',
		phone: '+49 40 87654321',
		company: '',
		jobTitle: '',
		address: 'Hamburg, Deutschland',
		notes: 'Geburtstag nicht vergessen!',
		birthday: '1992-03-22',
		tags: ['Familie'],
		isFavorite: true,
		isArchived: false,
	},
];
