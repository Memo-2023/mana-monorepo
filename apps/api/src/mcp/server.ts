/**
 * Mana MCP Server — exposes AI_TOOL_CATALOG as MCP tools for external
 * clients (Claude Desktop, Cursor, VS Code Copilot, etc.).
 *
 * Uses the Streamable HTTP transport (WebStandard variant) which works
 * natively with Hono/Bun. Clients connect via:
 *
 *   POST /api/v1/mcp   — send JSON-RPC messages
 *   GET  /api/v1/mcp   — open SSE stream for responses
 *   DELETE /api/v1/mcp  — close session
 *
 * Auth: inherits the existing authMiddleware() from the parent Hono app,
 * so every MCP request carries a valid JWT or API key.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { AI_TOOL_CATALOG } from '@mana/shared-ai';
import { executeMcpTool } from './executor';
import { z } from 'zod';

/** Convert ToolSchema parameters → Zod shape for McpServer.tool(). */
function toZodShape(
	params: (typeof AI_TOOL_CATALOG)[number]['parameters']
): Record<string, z.ZodTypeAny> {
	const shape: Record<string, z.ZodTypeAny> = {};
	for (const p of params) {
		let field: z.ZodTypeAny;
		if (p.type === 'number') field = z.number().describe(p.description);
		else if (p.type === 'boolean') field = z.boolean().describe(p.description);
		else if (p.enum) field = z.enum(p.enum as [string, ...string[]]).describe(p.description);
		else field = z.string().describe(p.description);
		if (!p.required) field = field.optional();
		shape[p.name] = field;
	}
	return shape;
}

/**
 * Create a new McpServer instance with all Mana tools registered.
 */
function createMcpServer(): McpServer {
	const server = new McpServer({ name: 'mana', version: '1.0.0' }, { capabilities: { tools: {} } });

	// Register all 29 tools from the AI Tool Catalog
	for (const tool of AI_TOOL_CATALOG) {
		const zodShape = toZodShape(tool.parameters);
		const hasParams = Object.keys(zodShape).length > 0;

		if (hasParams) {
			server.tool(tool.name, tool.description, zodShape, async (args) => {
				return executeMcpTool(tool.name, args, 'mcp-user');
			});
		} else {
			server.tool(tool.name, tool.description, async () => {
				return executeMcpTool(tool.name, {}, 'mcp-user');
			});
		}
	}

	return server;
}

/** Map of active sessions → their transport instances. */
const sessions = new Map<string, WebStandardStreamableHTTPServerTransport>();

/**
 * Handle an incoming HTTP request on the MCP endpoint.
 *
 * Supports stateful sessions: the transport generates a session ID on
 * initialization, and subsequent requests must carry it via the
 * `Mcp-Session-Id` header.
 */
export async function handleMcpRequest(req: Request): Promise<Response> {
	const sessionId = req.headers.get('mcp-session-id');

	// Existing session — route to its transport
	if (sessionId && sessions.has(sessionId)) {
		const transport = sessions.get(sessionId)!;
		return transport.handleRequest(req);
	}

	// New session (POST without session ID = initialization)
	if (req.method === 'POST' && !sessionId) {
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => crypto.randomUUID(),
			onsessioninitialized: (id) => {
				sessions.set(id, transport);
			},
			onsessionclosed: (id) => {
				sessions.delete(id);
			},
		});

		const server = createMcpServer();
		await server.connect(transport);

		return transport.handleRequest(req);
	}

	// Invalid request
	if (sessionId && !sessions.has(sessionId)) {
		return new Response(JSON.stringify({ error: 'Session not found' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ error: 'Bad request' }), {
		status: 400,
		headers: { 'Content-Type': 'application/json' },
	});
}
