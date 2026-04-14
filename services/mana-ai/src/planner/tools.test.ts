import { describe, it, expect } from 'bun:test';
import { AI_PROPOSABLE_TOOL_SET } from '@mana/shared-ai';
import { AI_AVAILABLE_TOOLS, AI_AVAILABLE_TOOL_NAMES } from './tools';

describe('AI_AVAILABLE_TOOLS contract', () => {
	it('every AvailableTool name is in the shared proposable set', () => {
		for (const tool of AI_AVAILABLE_TOOLS) {
			expect(
				AI_PROPOSABLE_TOOL_SET.has(tool.name),
				`"${tool.name}" missing from @mana/shared-ai AI_PROPOSABLE_TOOL_NAMES`
			).toBe(true);
		}
	});

	it('every shared proposable name has an AvailableTool entry', () => {
		for (const name of AI_PROPOSABLE_TOOL_SET) {
			expect(
				AI_AVAILABLE_TOOL_NAMES.has(name),
				`"${name}" missing from services/mana-ai AI_AVAILABLE_TOOLS — add the tool definition`
			).toBe(true);
		}
	});

	it('every tool has at least a name + description + module', () => {
		for (const tool of AI_AVAILABLE_TOOLS) {
			expect(tool.name.length).toBeGreaterThan(0);
			expect(tool.module.length).toBeGreaterThan(0);
			expect(tool.description.length).toBeGreaterThan(0);
		}
	});

	it('required params carry a non-empty description', () => {
		for (const tool of AI_AVAILABLE_TOOLS) {
			for (const p of tool.parameters) {
				if (p.required) {
					expect(p.description.length, `${tool.name}.${p.name}.description`).toBeGreaterThan(0);
				}
			}
		}
	});
});
