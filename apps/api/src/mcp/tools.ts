/**
 * MCP Tool Definitions — transforms AI_TOOL_CATALOG into MCP-compatible
 * tool listings with JSON Schema inputSchema.
 *
 * The catalog in @mana/shared-ai is the single source of truth. This
 * module provides the MCP wire format for tools/list responses.
 */

import { AI_TOOL_CATALOG, type ToolSchema } from '@mana/shared-ai';

/** Convert ToolSchema parameters → JSON Schema for MCP inputSchema. */
function toJsonSchema(params: ToolSchema['parameters']): {
	type: 'object';
	properties: Record<string, Record<string, unknown>>;
	required: string[];
} {
	const properties: Record<string, Record<string, unknown>> = {};
	const required: string[] = [];
	for (const p of params) {
		const prop: Record<string, unknown> = { type: p.type, description: p.description };
		if (p.enum) prop.enum = p.enum;
		properties[p.name] = prop;
		if (p.required) required.push(p.name);
	}
	return { type: 'object', properties, required };
}

/** MCP tool definitions derived from the AI Tool Catalog. */
export const MCP_TOOLS = AI_TOOL_CATALOG.map((t) => ({
	name: t.name,
	description: t.description,
	inputSchema: toJsonSchema(t.parameters),
}));
