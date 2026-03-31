export const CONTACT_FIELD_LABELS: Record<string, string> = {
	firstName: 'Vorname',
	lastName: 'Nachname',
	email: 'E-Mail',
	phone: 'Telefon',
	mobile: 'Mobil',
	company: 'Firma',
	jobTitle: 'Position',
	street: 'Straße',
	city: 'Stadt',
	postalCode: 'Postleitzahl',
	country: 'Land',
	website: 'Webseite',
	notes: 'Notizen',
	birthday: 'Geburtstag',
};

export function getMatchTypeLabel(type: 'email' | 'phone' | 'name'): string {
	switch (type) {
		case 'email':
			return 'E-Mail';
		case 'phone':
			return 'Telefon';
		case 'name':
			return 'Name';
	}
}
