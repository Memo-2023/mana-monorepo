/**
 * Guest seed data for the CityCorners app.
 *
 * Provides example cities and locations for the onboarding experience.
 */

import type { LocalCity, LocalLocation } from './local-store';

export const guestCities: LocalCity[] = [
	{
		id: 'city-konstanz',
		name: 'Konstanz',
		slug: 'konstanz',
		country: 'Deutschland',
		state: 'Baden-Württemberg',
		description:
			'Universitätsstadt am Bodensee mit mittelalterlicher Altstadt, direkt an der Schweizer Grenze.',
		latitude: 47.6603,
		longitude: 9.1757,
	},
	{
		id: 'city-zuerich',
		name: 'Zürich',
		slug: 'zuerich',
		country: 'Schweiz',
		state: 'Zürich',
		description:
			'Größte Stadt der Schweiz am Zürichsee, bekannt für Kultur, Finanzen und hohe Lebensqualität.',
		latitude: 47.3769,
		longitude: 8.5417,
	},
	{
		id: 'city-berlin',
		name: 'Berlin',
		slug: 'berlin',
		country: 'Deutschland',
		state: 'Berlin',
		description: 'Hauptstadt Deutschlands mit vielfältiger Kultur, Geschichte und Nachtleben.',
		latitude: 52.52,
		longitude: 13.405,
	},
];

export const guestLocations: LocalLocation[] = [
	{
		id: 'loc-muenster',
		cityId: 'city-konstanz',
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
		cityId: 'city-konstanz',
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
		cityId: 'city-konstanz',
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
		cityId: 'city-konstanz',
		name: 'Strandbad Horn',
		category: 'beach',
		description: 'Beliebtes Freibad am Bodensee mit Sandstrand und Blick auf die Alpen.',
		address: 'Eichhornstraße 100, 78464 Konstanz',
		latitude: 47.6753,
		longitude: 9.2001,
	},
	{
		id: 'loc-grossmuenster',
		cityId: 'city-zuerich',
		name: 'Grossmünster',
		category: 'sight',
		description:
			'Romanische Kirche aus dem 12. Jahrhundert, Wahrzeichen Zürichs mit Aussichtsturm über die Altstadt.',
		address: 'Grossmünsterplatz, 8001 Zürich',
		latitude: 47.3701,
		longitude: 8.5441,
	},
	{
		id: 'loc-brandenburger-tor',
		cityId: 'city-berlin',
		name: 'Brandenburger Tor',
		category: 'sight',
		description: 'Das bekannteste Wahrzeichen Berlins und Symbol der deutschen Wiedervereinigung.',
		address: 'Pariser Platz, 10117 Berlin',
		latitude: 52.5163,
		longitude: 13.3777,
	},
];
