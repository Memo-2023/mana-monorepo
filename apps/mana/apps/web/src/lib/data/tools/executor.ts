/**
 * Tool Executor — Validates parameters and runs a tool by name.
 */

import { getTool } from './registry';
import type { ToolResult } from './types';

export async function executeTool(
	name: string,
	params: Record<string, unknown>
): Promise<ToolResult> {
	const tool = getTool(name);
	if (!tool) {
		return { success: false, message: `Unknown tool: ${name}` };
	}

	// Validate required parameters
	for (const p of tool.parameters) {
		if (p.required && (params[p.name] === undefined || params[p.name] === null)) {
			return { success: false, message: `Missing required parameter: ${p.name}` };
		}
	}

	// Validate types
	for (const p of tool.parameters) {
		const val = params[p.name];
		if (val === undefined || val === null) continue;

		if (p.type === 'number' && typeof val !== 'number') {
			const num = Number(val);
			if (isNaN(num)) {
				return { success: false, message: `Parameter ${p.name} must be a number` };
			}
			params[p.name] = num;
		}
		if (p.type === 'boolean' && typeof val !== 'boolean') {
			params[p.name] = val === 'true' || val === true;
		}
		if (p.enum && !p.enum.includes(String(val))) {
			return {
				success: false,
				message: `Parameter ${p.name} must be one of: ${p.enum.join(', ')}`,
			};
		}
	}

	try {
		return await tool.execute(params);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, message: `Tool execution failed: ${msg}` };
	}
}
