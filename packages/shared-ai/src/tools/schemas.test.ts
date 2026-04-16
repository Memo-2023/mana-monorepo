import { describe, expect, it } from 'vitest';
import { AI_TOOL_CATALOG, AI_TOOL_CATALOG_BY_NAME } from './schemas';

describe('AI_TOOL_CATALOG', () => {
	it('has no duplicate tool names', () => {
		const names = AI_TOOL_CATALOG.map((t) => t.name);
		expect(names.length).toBe(new Set(names).size);
	});

	it('every tool has a non-empty name, module, and description', () => {
		for (const tool of AI_TOOL_CATALOG) {
			expect(tool.name.length, `tool name empty`).toBeGreaterThan(0);
			expect(tool.module.length, `${tool.name}: module empty`).toBeGreaterThan(0);
			expect(tool.description.length, `${tool.name}: description empty`).toBeGreaterThan(0);
		}
	});

	it('every parameter has a description', () => {
		for (const tool of AI_TOOL_CATALOG) {
			for (const param of tool.parameters) {
				expect(
					param.description.length,
					`${tool.name}.${param.name}: description empty`
				).toBeGreaterThan(0);
			}
		}
	});

	it('defaultPolicy is either auto or propose', () => {
		for (const tool of AI_TOOL_CATALOG) {
			expect(['auto', 'propose']).toContain(tool.defaultPolicy);
		}
	});

	it('has both propose and auto tools', () => {
		const propose = AI_TOOL_CATALOG.filter((t) => t.defaultPolicy === 'propose');
		const auto = AI_TOOL_CATALOG.filter((t) => t.defaultPolicy === 'auto');
		expect(propose.length).toBeGreaterThan(0);
		expect(auto.length).toBeGreaterThan(0);
		expect(propose.length + auto.length).toBe(AI_TOOL_CATALOG.length);
	});

	it('by-name map has same size as catalog', () => {
		expect(AI_TOOL_CATALOG_BY_NAME.size).toBe(AI_TOOL_CATALOG.length);
	});
});
