import { describe, expect, it } from 'vitest';
import { AI_TOOL_CATALOG } from './schemas';
import { toolToFunctionSchema, toolsToFunctionSchemas } from './function-schema';
import type { ToolSchema } from './schemas';

describe('toolToFunctionSchema', () => {
	it('converts a minimal tool with no parameters', () => {
		const tool: ToolSchema = {
			name: 'ping',
			module: 'test',
			description: 'Test tool',
			defaultPolicy: 'auto',
			parameters: [],
		};
		expect(toolToFunctionSchema(tool)).toEqual({
			type: 'function',
			function: {
				name: 'ping',
				description: 'Test tool',
				parameters: {
					type: 'object',
					properties: {},
					required: [],
				},
			},
		});
	});

	it('maps parameter types and marks required fields', () => {
		const tool: ToolSchema = {
			name: 'create_thing',
			module: 'test',
			description: 'Create a thing',
			defaultPolicy: 'propose',
			parameters: [
				{ name: 'title', type: 'string', description: 'Title', required: true },
				{ name: 'count', type: 'number', description: 'Count', required: false },
				{ name: 'enabled', type: 'boolean', description: 'Flag', required: false },
			],
		};
		const schema = toolToFunctionSchema(tool);
		expect(schema.function.parameters.properties.title).toEqual({
			type: 'string',
			description: 'Title',
		});
		expect(schema.function.parameters.properties.count.type).toBe('number');
		expect(schema.function.parameters.properties.enabled.type).toBe('boolean');
		expect(schema.function.parameters.required).toEqual(['title']);
	});

	it('preserves enum when present', () => {
		const tool: ToolSchema = {
			name: 'pick',
			module: 'test',
			description: 'Pick one',
			defaultPolicy: 'auto',
			parameters: [
				{
					name: 'color',
					type: 'string',
					description: 'Color',
					required: true,
					enum: ['red', 'blue', 'green'],
				},
			],
		};
		const schema = toolToFunctionSchema(tool);
		expect(schema.function.parameters.properties.color.enum).toEqual(['red', 'blue', 'green']);
	});

	it('does not add an enum key when the parameter has none', () => {
		const tool: ToolSchema = {
			name: 'x',
			module: 'test',
			description: 'X',
			defaultPolicy: 'auto',
			parameters: [{ name: 'y', type: 'string', description: 'Y', required: true }],
		};
		const prop = toolToFunctionSchema(tool).function.parameters.properties.y;
		expect('enum' in prop).toBe(false);
	});

	it('throws on unknown parameter types (catalog typo guard)', () => {
		const tool: ToolSchema = {
			name: 'broken',
			module: 'test',
			description: 'Broken',
			defaultPolicy: 'auto',
			parameters: [
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				{ name: 'p', type: 'array' as any, description: 'p', required: true },
			],
		};
		expect(() => toolToFunctionSchema(tool)).toThrow(/Unsupported parameter type/);
	});
});

describe('toolsToFunctionSchemas', () => {
	it('round-trips the whole catalog without throwing', () => {
		const schemas = toolsToFunctionSchemas(AI_TOOL_CATALOG);
		expect(schemas.length).toBe(AI_TOOL_CATALOG.length);
		for (const s of schemas) {
			expect(s.type).toBe('function');
			expect(s.function.name).toMatch(/^[a-z_]+$/);
			expect(s.function.parameters.type).toBe('object');
		}
	});

	it('produces globally unique function names (matches catalog)', () => {
		const schemas = toolsToFunctionSchemas(AI_TOOL_CATALOG);
		const names = schemas.map((s) => s.function.name);
		expect(new Set(names).size).toBe(names.length);
	});
});
