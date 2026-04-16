/**
 * MCP Tool Executor — handles tools/call requests by routing to module
 * handlers or returning status messages.
 *
 * Phase 1: Read-only tools query the sync database directly.
 * Phase 2: Write tools will insert into sync_changes (like mana-ai does).
 */

import { AI_TOOL_CATALOG_BY_NAME } from '@mana/shared-ai';

export interface McpToolResult {
	[key: string]: unknown;
	content: Array<{ type: 'text'; text: string }>;
	isError?: boolean;
}

/**
 * Execute an MCP tool call. Returns MCP-formatted result content.
 *
 * Phase 1 scope:
 * - All tools are listed (via tools/list from AI_TOOL_CATALOG)
 * - Write tools return a "coming soon" message
 * - Read tools are planned for Phase 2 (requires sync DB queries)
 */
export async function executeMcpTool(
	toolName: string,
	args: Record<string, unknown>,
	_userId: string
): Promise<McpToolResult> {
	const schema = AI_TOOL_CATALOG_BY_NAME.get(toolName);
	if (!schema) {
		return {
			content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
			isError: true,
		};
	}

	// Phase 1: all tools return a descriptive message about what they will do.
	// Phase 2 will implement actual DB reads and sync_changes writes.
	if (schema.defaultPolicy === 'auto') {
		return {
			content: [
				{
					type: 'text',
					text:
						`[Mana MCP] Read-tool "${toolName}" (${schema.module}) acknowledged.\n` +
						`Args: ${JSON.stringify(args)}\n` +
						`Note: Server-side execution coming in Phase 2. ` +
						`This tool will query the sync database for user data.`,
				},
			],
		};
	}

	return {
		content: [
			{
				type: 'text',
				text:
					`[Mana MCP] Write-tool "${toolName}" (${schema.module}) acknowledged.\n` +
					`Args: ${JSON.stringify(args)}\n` +
					`Note: Server-side execution coming in Phase 2. ` +
					`This tool will write to the sync database and appear on your devices.`,
			},
		],
	};
}
