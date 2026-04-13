/**
 * Tool Registry — Collects ModuleTools and generates LLM schemas.
 */

import type { ModuleTool, LlmFunctionSchema } from './types';

const tools: ModuleTool[] = [];

/** Register tools from a module. Call once per module at init. */
export function registerTools(moduleTools: ModuleTool[]): void {
	for (const tool of moduleTools) {
		if (!tools.some((t) => t.name === tool.name)) {
			tools.push(tool);
		}
	}
}

/** Get all registered tools. */
export function getTools(): readonly ModuleTool[] {
	return tools;
}

/** Get a tool by name. */
export function getTool(name: string): ModuleTool | undefined {
	return tools.find((t) => t.name === name);
}

/** Get tools for a specific module. */
export function getToolsForModule(module: string): ModuleTool[] {
	return tools.filter((t) => t.module === module);
}

/** Generate LLM function-calling schemas for all registered tools. */
export function getToolsForLlm(): LlmFunctionSchema[] {
	return tools.map((t) => ({
		name: t.name,
		description: t.description,
		parameters: {
			type: 'object' as const,
			properties: Object.fromEntries(
				t.parameters.map((p) => [
					p.name,
					{
						type: p.type,
						description: p.description,
						...(p.enum ? { enum: p.enum } : {}),
					},
				])
			),
			required: t.parameters.filter((p) => p.required).map((p) => p.name),
		},
	}));
}
