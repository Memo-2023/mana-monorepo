/**
 * Tests for the sensitive-query detector. The shape of the regex list is
 * the privacy claim — false negatives (a sensitive query slipping through
 * to public APIs) are the biggest risk, so this file leans heavily on
 * positive cases for the categories we care about. False positives get a
 * lighter pass: we test that obvious non-matches don't trigger but we
 * accept some over-blocking on edge phrases (a 0-result UX hit is much
 * better than leaking medical search to a third party).
 */

import { describe, expect, it } from 'bun:test';
import { isSensitiveQuery } from '../sensitive-query';

describe('isSensitiveQuery — health professionals', () => {
	it('matches single doctor terms', () => {
		expect(isSensitiveQuery('Hausarzt Konstanz').sensitive).toBe(true);
		expect(isSensitiveQuery('Frauenarzt München').sensitive).toBe(true);
		expect(isSensitiveQuery('Kinderarzt Berlin').sensitive).toBe(true);
		expect(isSensitiveQuery('Zahnärztin Hamburg').sensitive).toBe(false); // dental — not in narrow list
	});

	it('matches specialist terms regardless of case', () => {
		expect(isSensitiveQuery('PSYCHIATER').sensitive).toBe(true);
		expect(isSensitiveQuery('Urologe').sensitive).toBe(true);
		expect(isSensitiveQuery('Dermatologe').sensitive).toBe(true);
		expect(isSensitiveQuery('gynäkologe').sensitive).toBe(true);
		expect(isSensitiveQuery('Onkologe Konstanz').sensitive).toBe(true);
	});

	it('reports the matched token for logging (not exposed to client)', () => {
		const result = isSensitiveQuery('Praxis Hausarzt Müller');
		expect(result.sensitive).toBe(true);
		expect(result.matchedToken?.toLowerCase()).toBe('hausarzt');
	});
});

describe('isSensitiveQuery — clinics + mental health', () => {
	it('matches Klinikum / Hospiz / Reha-Klinik', () => {
		expect(isSensitiveQuery('Klinikum Konstanz').sensitive).toBe(true);
		expect(isSensitiveQuery('Hospiz Stuttgart').sensitive).toBe(true);
		expect(isSensitiveQuery('Reha-Klinik Bayern').sensitive).toBe(true);
		// Plain "Krankenhaus" is too common as a street name — we keep it
		// out of the list (documented trade-off in sensitive-query.ts)
		expect(isSensitiveQuery('Krankenhausstraße 5').sensitive).toBe(false);
	});

	it('matches Psycho* terms', () => {
		expect(isSensitiveQuery('Psychiatrie Konstanz').sensitive).toBe(true);
		expect(isSensitiveQuery('Psychotherapie Berlin').sensitive).toBe(true);
		expect(isSensitiveQuery('Psychotherapeutin München').sensitive).toBe(true);
		expect(isSensitiveQuery('Psychologe').sensitive).toBe(true);
	});
});

describe('isSensitiveQuery — addiction / sexual / crisis services', () => {
	it('matches addiction services', () => {
		expect(isSensitiveQuery('Suchtberatung Konstanz').sensitive).toBe(true);
		expect(isSensitiveQuery('Drogenberatung').sensitive).toBe(true);
		expect(isSensitiveQuery('Methadon-Ambulanz').sensitive).toBe(true);
	});

	it('matches sexual / reproductive health', () => {
		expect(isSensitiveQuery('HIV-Test Berlin').sensitive).toBe(true);
		expect(isSensitiveQuery('Schwangerschaftsabbruch').sensitive).toBe(true);
		expect(isSensitiveQuery('pro familia').sensitive).toBe(true);
	});

	it('matches crisis / domestic-violence services', () => {
		expect(isSensitiveQuery('Frauenhaus Konstanz').sensitive).toBe(true);
		expect(isSensitiveQuery('Telefonseelsorge').sensitive).toBe(true);
		expect(isSensitiveQuery('Krisendienst München').sensitive).toBe(true);
	});
});

describe('isSensitiveQuery — false positives we explicitly accept', () => {
	it('does NOT match generic non-medical queries', () => {
		expect(isSensitiveQuery('Konstanz Hauptbahnhof').sensitive).toBe(false);
		expect(isSensitiveQuery('Münsterplatz 5').sensitive).toBe(false);
		expect(isSensitiveQuery('Edeka Konstanz').sensitive).toBe(false);
		expect(isSensitiveQuery('Restaurant Konzil').sensitive).toBe(false);
		expect(isSensitiveQuery('Cafe Münster').sensitive).toBe(false);
	});

	it('does NOT match street names that contain medical-sounding tokens', () => {
		// Word boundaries: "hausarztstrasse" must not match "hausarzt"
		expect(isSensitiveQuery('Hausarztstraße 12').sensitive).toBe(false);
		// "Klinikstraße" → no clinic token by itself in the list ('klinikum' is)
		expect(isSensitiveQuery('Klinikstraße 5').sensitive).toBe(false);
	});

	it('does NOT match Apotheke (pharmacy is too commonly a landmark)', () => {
		// Documented trade-off: Apotheke isn't in the list because most
		// users searching for it want the building as a landmark. Health
		// inference from a pharmacy lookup is weaker than from a clinic.
		expect(isSensitiveQuery('Apotheke am Markt').sensitive).toBe(false);
	});

	it('handles edge cases gracefully', () => {
		expect(isSensitiveQuery('').sensitive).toBe(false);
		expect(isSensitiveQuery('a').sensitive).toBe(false); // too short
		expect(isSensitiveQuery('   ').sensitive).toBe(false);
	});
});
