/**
 * Guest seed data for the CityCorners app.
 *
 * Provides iconic Konstanz locations for the onboarding experience.
 */

import type { LocalLocation } from './local-store';

export const guestLocations: LocalLocation[] = [
	{
		id: 'loc-muenster',
		name: 'Konstanzer Münster',
		category: 'sight',
		description:
			'Das Münster Unserer Lieben Frau ist die ehemalige Bischofskirche des Bistums Konstanz und Wahrzeichen der Stadt.',
		address: 'Münsterplatz 1, 78462 Konstanz',
		latitude: 47.6603,
		longitude: 9.1752,
	},
	{
		id: 'loc-imperia',
		name: 'Imperia',
		category: 'sight',
		description:
			'Die 9 Meter hohe Statue im Hafen von Konstanz dreht sich einmal in 4 Minuten um ihre Achse.',
		address: 'Hafen, 78462 Konstanz',
		latitude: 47.6596,
		longitude: 9.1789,
	},
	{
		id: 'loc-insel',
		name: 'Mainau – Blumeninsel',
		category: 'park',
		description:
			'Die Blumeninsel Mainau im Bodensee ist bekannt für ihre Gärten, das Schmetterlingshaus und das Barockschloss.',
		address: 'Mainau 1, 78465 Konstanz',
		latitude: 47.7051,
		longitude: 9.1919,
	},
	{
		id: 'loc-strandbad',
		name: 'Strandbad Horn',
		category: 'beach',
		description: 'Beliebtes Freibad am Bodensee mit Sandstrand und Blick auf die Alpen.',
		address: 'Eichhornstraße 100, 78464 Konstanz',
		latitude: 47.6753,
		longitude: 9.2001,
	},
];
