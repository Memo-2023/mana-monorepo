import { describe, it, expect } from 'bun:test';
import { AI_PROPOSABLE_TOOL_SET } from '@mana/shared-ai';
import { SERVER_TOOLS, SERVER_TOOL_NAMES } from './tools';

describe('SERVER_TOOLS contract', () => {
	it('every server tool is in the shared proposable set', () => {
		for (const tool of SERVER_TOOLS) {
			expect(
				AI_PROPOSABLE_TOOL_SET.has(tool.name),
				`"${tool.name}" missing from @mana/shared-ai AI_PROPOSABLE_TOOL_NAMES`
			).toBe(true);
		}
	});

	it('every shared proposable is reachable from the server', () => {
		for (const name of AI_PROPOSABLE_TOOL_SET) {
			expect(
				SERVER_TOOL_NAMES.has(name),
				`"${name}" missing from SERVER_TOOLS — catalog propose-tool not exposed`
			).toBe(true);
		}
	});

	it('every tool has a name, module, and description', () => {
		for (const tool of SERVER_TOOLS) {
			expect(tool.name.length).toBeGreaterThan(0);
			expect(tool.module.length).toBeGreaterThan(0);
			expect(tool.description.length).toBeGreaterThan(0);
		}
	});

	it('required params carry a non-empty description', () => {
		for (const tool of SERVER_TOOLS) {
			for (const p of tool.parameters) {
				if (p.required) {
					expect(p.description.length, `${tool.name}.${p.name}.description`).toBeGreaterThan(0);
				}
			}
		}
	});
});
