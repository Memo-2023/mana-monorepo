import { describe, it, expect } from 'vitest';
import { findDuplicates } from './duplicate-detector';

const contacts = [
	{ id: '1', firstName: 'Max', lastName: 'Mustermann', email: 'max@example.com', company: 'ACME' },
	{ id: '2', firstName: 'Anna', lastName: 'Schmidt', email: 'anna@google.com', company: 'Google' },
	{ id: '3', firstName: 'Peter', lastName: 'Müller', email: 'peter@mail.de', company: undefined },
	{ id: '4', firstName: 'Max', lastName: 'Meier', email: 'meier@test.de', company: 'Test GmbH' },
];

describe('findDuplicates', () => {
	it('should find exact email match', () => {
		const result = findDuplicates({ email: 'max@example.com' }, contacts);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
		expect(result[0].matchField).toBe('email');
	});

	it('should find email match case-insensitively', () => {
		const result = findDuplicates({ email: 'MAX@EXAMPLE.COM' }, contacts);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('should find name match (both first + last)', () => {
		const result = findDuplicates({ firstName: 'Max', lastName: 'Mustermann' }, contacts);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
		expect(result[0].matchField).toBe('name');
	});

	it('should find fuzzy name match (typo)', () => {
		const result = findDuplicates({ firstName: 'Max', lastName: 'Musterman' }, contacts);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('1');
	});

	it('should not match on first name only when too short', () => {
		const result = findDuplicates({ firstName: 'M' }, contacts);
		expect(result).toHaveLength(0);
	});

	it('should find partial first name match with existing last name', () => {
		const result = findDuplicates({ firstName: 'Anna' }, contacts);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('2');
	});

	it('should return no duplicates for unique contact', () => {
		const result = findDuplicates(
			{ firstName: 'Lena', lastName: 'Weber', email: 'lena@new.de' },
			contacts
		);
		expect(result).toHaveLength(0);
	});

	it('should exclude contact by ID (edit mode)', () => {
		const result = findDuplicates({ email: 'max@example.com' }, contacts, '1');
		expect(result).toHaveLength(0);
	});

	it('should prioritize email matches over name matches', () => {
		const result = findDuplicates(
			{ firstName: 'Max', lastName: 'Mustermann', email: 'anna@google.com' },
			contacts
		);
		// Email match (Anna) should come first, name match (Max) second
		expect(result.length).toBeGreaterThanOrEqual(2);
		expect(result[0].matchField).toBe('email');
		expect(result[0].id).toBe('2');
	});

	it('should show company in display name', () => {
		const result = findDuplicates({ email: 'max@example.com' }, contacts);
		expect(result[0].displayName).toContain('ACME');
	});

	it('should handle empty input gracefully', () => {
		const result = findDuplicates({}, contacts);
		expect(result).toHaveLength(0);
	});
});
