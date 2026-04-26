/**
 * Pseudonym generator for the public-community surface.
 *
 * Same hash-input always yields the same display_name → users see "their"
 * pseudonym consistently across submissions, but real userId is never
 * exposed.
 *
 * Generation:
 *   "{Adjektiv} {Tier} #{HashSuffix}"
 *   e.g. "Wachsame Eule #4528", "Heimliche Otter #0091"
 *
 * Naming space: 100 adjectives × 80 animals × 10000 numeric suffixes
 *   = 80 million combinations. Collision risk irrelevant in practice.
 *
 * The 4-digit suffix is the last 4 hex characters of the hash interpreted
 * as decimal (modulo 10000). Adjective and animal indices are derived
 * from disjoint hash slices so they vary independently.
 */

import { createHash } from 'crypto';

const ADJECTIVES = [
	'Wachsame',
	'Heimliche',
	'Stille',
	'Kühne',
	'Sanfte',
	'Wilde',
	'Listige',
	'Weise',
	'Mutige',
	'Träumerische',
	'Neugierige',
	'Treue',
	'Verspielte',
	'Bedächtige',
	'Flinke',
	'Helle',
	'Dunkle',
	'Goldene',
	'Silberne',
	'Funkelnde',
	'Glühende',
	'Kühle',
	'Warme',
	'Singende',
	'Tanzende',
	'Schweigende',
	'Lauschende',
	'Suchende',
	'Findende',
	'Wandernde',
	'Schwebende',
	'Tauchende',
	'Träumende',
	'Wache',
	'Frohe',
	'Ernste',
	'Leise',
	'Laute',
	'Sanfte',
	'Schnelle',
	'Langsame',
	'Geheime',
	'Offene',
	'Versteckte',
	'Sichtbare',
	'Strahlende',
	'Glänzende',
	'Matte',
	'Helle',
	'Schimmernde',
	'Flackernde',
	'Stetige',
	'Bewegte',
	'Ruhige',
	'Stürmische',
	'Friedliche',
	'Kämpferische',
	'Freundliche',
	'Misstrauische',
	'Vertrauende',
	'Hoffende',
	'Zweifelnde',
	'Glaubende',
	'Fragende',
	'Antwortende',
	'Lernende',
	'Lehrende',
	'Wachsende',
	'Reife',
	'Junge',
	'Alte',
	'Zeitlose',
	'Frische',
	'Müde',
	'Wache',
	'Schlafende',
	'Erwachende',
	'Träumende',
	'Erinnernde',
	'Vergessende',
	'Zählende',
	'Sammelnde',
	'Verschenkende',
	'Bewahrende',
	'Suchende',
	'Wartende',
	'Eilende',
	'Bleibende',
	'Reisende',
	'Heimkehrende',
	'Aufbrechende',
	'Ankommende',
	'Lauschende',
	'Singende',
	'Pfeifende',
	'Summende',
	'Knurrende',
	'Schnurrende',
	'Lachende',
	'Weinende',
	'Schmunzelnde',
	'Staunende',
];

const ANIMALS = [
	'Eule',
	'Otter',
	'Fuchs',
	'Wolf',
	'Bär',
	'Luchs',
	'Adler',
	'Reiher',
	'Kranich',
	'Schwalbe',
	'Lerche',
	'Amsel',
	'Specht',
	'Falke',
	'Habicht',
	'Sperber',
	'Krähe',
	'Rabe',
	'Elster',
	'Häher',
	'Star',
	'Drossel',
	'Meise',
	'Fink',
	'Sperling',
	'Schmetterling',
	'Libelle',
	'Hirsch',
	'Reh',
	'Gämse',
	'Steinbock',
	'Murmeltier',
	'Eichhörnchen',
	'Iltis',
	'Marder',
	'Dachs',
	'Igel',
	'Wiesel',
	'Hermelin',
	'Salamander',
	'Molch',
	'Frosch',
	'Kröte',
	'Eidechse',
	'Schlange',
	'Schildkröte',
	'Karpfen',
	'Hecht',
	'Forelle',
	'Lachs',
	'Stör',
	'Aal',
	'Krebs',
	'Schnecke',
	'Spinne',
	'Käfer',
	'Hummel',
	'Biene',
	'Wespe',
	'Ameise',
	'Grashüpfer',
	'Grille',
	'Heuschrecke',
	'Marienkäfer',
	'Hirschkäfer',
	'Robbe',
	'Seehund',
	'Delfin',
	'Wal',
	'Hai',
	'Möwe',
	'Albatros',
	'Pelikan',
	'Kormoran',
	'Pinguin',
	'Schwan',
	'Gans',
	'Ente',
	'Storch',
	'Ibis',
];

function hashToBigInt(hash: string): bigint {
	// Strip non-hex chars, take first 16 hex chars (64-bit slice).
	const slice = hash.replace(/[^0-9a-f]/gi, '').slice(0, 16);
	return BigInt('0x' + slice);
}

/**
 * Deterministically derive a display name from a display-hash.
 *
 * @param displayHash hex string from createDisplayHash().
 * @returns "{Adjektiv} {Tier} #{NNNN}" — stable across calls for same hash.
 */
export function generateDisplayName(displayHash: string): string {
	const big = hashToBigInt(displayHash);
	const adj = ADJECTIVES[Number(big % BigInt(ADJECTIVES.length))];
	const animal = ANIMALS[Number((big / BigInt(ADJECTIVES.length)) % BigInt(ANIMALS.length))];
	const suffix = Number((big / BigInt(ADJECTIVES.length * ANIMALS.length)) % 10000n)
		.toString()
		.padStart(4, '0');
	return `${adj} ${animal} #${suffix}`;
}

/**
 * Derive a non-reversible display hash for a given userId.
 * Same userId + same secret always produces the same hash.
 */
export function createDisplayHash(userId: string, secret: string): string {
	return createHash('sha256').update(`${userId}:${secret}`).digest('hex');
}

// Exported for tests.
export const __TEST__ = { ADJECTIVES, ANIMALS };
