/**
 * Schema Tests
 */

import { describe, it, expect } from 'vitest';
import {
	encodeSchema,
	decodeSchema,
	getSchemaPixelCount,
	createTodoSchema,
	validateRecord,
	getFieldNames,
} from './schema.js';

// =============================================================================
// SCHEMA ENCODE / DECODE
// =============================================================================

describe('Schema Encode/Decode', () => {
	it('should round-trip the todo schema', () => {
		const schema = createTodoSchema();
		const pixels = encodeSchema(schema);
		const fieldNames = getFieldNames(schema);
		const decoded = decodeSchema(pixels, fieldNames);

		expect(decoded.version).toBe(schema.version);
		expect(decoded.fields.length).toBe(schema.fields.length);

		for (let i = 0; i < schema.fields.length; i++) {
			expect(decoded.fields[i].name).toBe(schema.fields[i].name);
			expect(decoded.fields[i].type).toBe(schema.fields[i].type);
			expect(decoded.fields[i].maxLength).toBe(schema.fields[i].maxLength);
			expect(decoded.fields[i].nullable).toBe(schema.fields[i].nullable ?? false);
		}
	});

	it('should encode a minimal schema (1 field)', () => {
		const schema = {
			version: 1,
			name: 'minimal',
			fields: [{ name: 'id', type: 'int' as const, maxLength: 8 }],
		};
		const pixels = encodeSchema(schema);
		expect(pixels.length).toBeGreaterThan(0);

		const decoded = decodeSchema(pixels, ['id']);
		expect(decoded.fields).toHaveLength(1);
		expect(decoded.fields[0].type).toBe('int');
		expect(decoded.fields[0].maxLength).toBe(8);
	});

	it('should handle nullable fields correctly', () => {
		const schema = {
			version: 2,
			name: 'nullable_test',
			fields: [
				{ name: 'required', type: 'string' as const, maxLength: 100 },
				{ name: 'optional', type: 'string' as const, maxLength: 100, nullable: true },
			],
		};
		const pixels = encodeSchema(schema);
		const decoded = decodeSchema(pixels, ['required', 'optional']);

		expect(decoded.fields[0].nullable).toBe(false);
		expect(decoded.fields[1].nullable).toBe(true);
	});

	it('should preserve version number', () => {
		const schema = { version: 511, name: 'max_ver', fields: [] };
		const pixels = encodeSchema(schema);
		const decoded = decodeSchema(pixels, []);
		expect(decoded.version).toBe(511);
	});
});

describe('getSchemaPixelCount', () => {
	it('should calculate pixel count for todo schema', () => {
		const schema = createTodoSchema();
		const count = getSchemaPixelCount(schema);
		const actualPixels = encodeSchema(schema);
		expect(count).toBe(actualPixels.length);
	});

	it('should return at least 1 for empty schema', () => {
		const schema = { version: 0, name: 'empty', fields: [] };
		const count = getSchemaPixelCount(schema);
		expect(count).toBeGreaterThanOrEqual(1);
	});
});

// =============================================================================
// VALIDATE RECORD
// =============================================================================

describe('validateRecord', () => {
	const schema = createTodoSchema();

	const validTodo = {
		id: 0,
		status: 0,
		priority: 1,
		createdAt: new Date(),
		dueDate: null,
		completedAt: null,
		title: 'Test',
		description: null,
		tags: [],
	};

	it('should accept a valid record', () => {
		const result = validateRecord(schema, validTodo);
		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should reject missing required field', () => {
		const record = { ...validTodo };
		delete (record as Record<string, unknown>).title;
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors).toContain("Field 'title' is required");
	});

	it('should allow null for nullable fields', () => {
		const record = { ...validTodo, dueDate: null, completedAt: null, description: null };
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(true);
	});

	it('should reject non-integer for int field', () => {
		const record = { ...validTodo, priority: 1.5 };
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('priority'))).toBe(true);
	});

	it('should reject out-of-range int', () => {
		const record = { ...validTodo, id: 5000 }; // max 4095 for 12-bit
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('out of range'))).toBe(true);
	});

	it('should reject negative int', () => {
		const record = { ...validTodo, priority: -1 };
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
	});

	it('should reject string too long', () => {
		const record = { ...validTodo, title: 'x'.repeat(256) }; // max 255
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('too long'))).toBe(true);
	});

	it('should reject wrong type for timestamp', () => {
		const record = { ...validTodo, createdAt: '2025-01-01' };
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('must be a Date'))).toBe(true);
	});

	it('should reject non-array for array field', () => {
		const record = { ...validTodo, tags: 'not-array' };
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('must be an array'))).toBe(true);
	});

	it('should reject array with too many items', () => {
		const record = { ...validTodo, tags: [1, 2, 3, 4, 5, 6, 7, 8, 9] }; // max 8
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes('too many items'))).toBe(true);
	});

	it('should collect multiple errors', () => {
		const record = {
			id: -1,
			status: 'invalid',
			priority: 100,
			createdAt: 'not-a-date',
			dueDate: null,
			completedAt: null,
			title: 123,
			description: null,
			tags: 'not-array',
		};
		const result = validateRecord(schema, record);
		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(3);
	});
});

describe('getFieldNames', () => {
	it('should return field names in order', () => {
		const schema = createTodoSchema();
		const names = getFieldNames(schema);
		expect(names[0]).toBe('id');
		expect(names[names.length - 1]).toBe('tags');
		expect(names.length).toBe(schema.fields.length);
	});
});
